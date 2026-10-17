from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import re
import time
import uuid
import logging
import ipaddress
from collections import deque
from datetime import datetime, timezone, timedelta
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
from typing import Optional

import httpx
from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

from security import (
    make_auth, audit, hash_password, verify_password, create_access_token,
    hash_reset_token, new_reset_token, public_user, utcnow, RESET_TOKEN_TTL_MINUTES,
)
from seeds import seed_all
from admin import make_admin_router

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("autraxis")

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="AUTRAXIS API", docs_url=None, redoc_url=None, openapi_url=None)
api_router = APIRouter(prefix="/api")

# Emergent managed email proxy. CONSTANT — never read from os.environ.
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ["EMERGENT_EMAIL_KEY"]
EMAIL_FROM_NAME = os.environ["EMAIL_FROM_NAME"]  # This app's OWN brand (G1)
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")
CONTACT_INBOX = os.environ.get("CONTACT_INBOX", "info@autraxis.com")
CAREERS_INBOX = os.environ.get("CAREERS_INBOX", "careers@autraxis.com")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "").rstrip("/")

metrics = {"requests": 0, "err_total": 0, "time_ms": 0.0, "max_ms": 0.0, "errors": deque(maxlen=50)}
STARTED_AT = time.time()

get_current_admin, require_cap = make_auth(db)


async def seed_admin():
    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "AUTRAXIS Admin",
            "role": "super_admin",
            "status": "active",
            "must_change_password": False,
            "token_version": 1,
            "created_at": utcnow(),
        })
        logger.info("Super admin seeded")
    elif existing.get("role") != "super_admin":
        await db.users.update_one({"email": admin_email}, {"$set": {"role": "super_admin", "status": "active"}})
        logger.info("Bootstrap account promoted to super_admin")
    # Password is intentionally NOT reconciled: the admin changes it in-app.


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.analytics_pageviews.create_index("day")
    await db.audit_logs.create_index("ts")
    await db.audit_logs.create_index("actor_email")
    await db.jobs.create_index("status")
    await db.content.create_index("key", unique=True)
    await db.password_resets.create_index("token_hash")
    for name in ("services", "solutions", "projects", "insights"):
        await db[f"cms_{name}"].create_index("id", unique=True)
    await db.jobs.create_index("id", unique=True)
    await seed_admin()
    await seed_all(db)


# ---- Email guardrail gate (G2/G3 structural defense) ----
_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str, reply_to: Optional[str] = None) -> Optional[str]:
    _assert_safe_email(subject, html)  # G2-G3 gate — never skip
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if reply_to or EMAIL_REPLY_TO:
        payload["contact_email"] = reply_to or EMAIL_REPLY_TO
    try:
        async with httpx.AsyncClient(timeout=30) as http:
            resp = await http.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY},
                json=payload,
            )
        resp.raise_for_status()
        await db.ops_state.update_one(
            {"key": "last_email"},
            {"$set": {"value": {"ts": utcnow(), "ok": True, "to_domain": to.split("@")[-1]}}},
            upsert=True,
        )
        return resp.json().get("id")
    except httpx.HTTPStatusError as e:
        await db.ops_state.update_one(
            {"key": "last_email"},
            {"$set": {"value": {"ts": utcnow(), "ok": False, "code": e.response.status_code}}},
            upsert=True,
        )
        try:
            code = e.response.json().get("code", "")
        except ValueError:
            code = ""
        if code in ("insufficient_credits", "integration_disabled", "daily_limit_reached"):
            logger.warning(f"Email paused: {code} ({e.response.status_code}): {e.response.json().get('message', '')}")
            raise HTTPException(status_code=503, detail="Email is temporarily unavailable")
        logger.error(f"Email send failed: {e.response.status_code} {e.response.text}")
        raise HTTPException(status_code=502, detail="Failed to send email")
    except HTTPException:
        raise
    except Exception as e:
        await db.ops_state.update_one(
            {"key": "last_email"},
            {"$set": {"value": {"ts": utcnow(), "ok": False, "code": "connection_error"}}},
            upsert=True,
        )
        logger.error(f"Email send error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send email")


# ---- Rate limiting (in-memory, per IP) ----
_hits: dict = {}


def _throttle(ip: str, limit: int = 6, window: int = 600, detail: str = "Too many requests. Please slow down."):
    now = time.time()
    hits = [t for t in _hits.get(ip, []) if now - t < window]
    if len(hits) >= limit:
        raise HTTPException(status_code=429, detail=detail)
    hits.append(now)
    _hits[ip] = hits


# ---- Models ----
class ContactIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    company: Optional[str] = Field(default="", max_length=160)
    topic: str = Field(default="General inquiry", max_length=120)
    message: str = Field(min_length=10, max_length=4000)
    website: str = Field(default="", max_length=200)  # honeypot — must stay empty


class CareersIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    role: str = Field(min_length=2, max_length=160)
    linkedin: Optional[str] = Field(default="", max_length=300)
    message: str = Field(min_length=10, max_length=4000)
    website: str = Field(default="", max_length=200)  # honeypot


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)


class ChangePasswordIn(BaseModel):
    current_password: str = Field(min_length=1, max_length=200)
    new_password: str = Field(min_length=10, max_length=200)


class ForgotIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str = Field(min_length=10, max_length=300)
    new_password: str = Field(min_length=10, max_length=200)


class PageviewIn(BaseModel):
    path: str = Field(min_length=1, max_length=200)


# ---- Email templates (server-side only, escaped — G4) ----
def _email_table(title: str, rows: list) -> str:
    body = "".join(
        f'<tr>'
        f'<td style="padding:10px 24px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748B;width:150px;vertical-align:top">{escape(k)}</td>'
        f'<td style="padding:10px 24px;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#0F172A">{escape(str(v)).replace(chr(10), "<br>")}</td>'
        f'</tr>'
        for k, v in rows
    )
    return (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:24px 0">'
        '<tr><td align="center">'
        '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px">'
        f'<tr><td style="padding:24px;border-bottom:1px solid #E2E8F0;font-family:Arial,sans-serif;font-size:18px;font-weight:bold;color:#0F172A">{escape(title)}</td></tr>'
        f'{body}'
        f'<tr><td colspan="2" style="padding:20px 24px;font-family:Arial,sans-serif;font-size:12px;color:#94A3B8;border-top:1px solid #E2E8F0">'
        f'Sent by the {escape(EMAIL_FROM_NAME)} website. We never ask for passwords, codes or payment details by email.'
        '</td></tr></table></td></tr></table>'
    )


# ---- Public routes ----
@api_router.get("/")
async def root():
    return {"service": "AUTRAXIS API", "status": "ok"}


@api_router.get("/health")
async def health():
    return {"status": "ok"}


@api_router.get("/ready")
async def ready():
    try:
        await db.command("ping")
        return {"status": "ready"}
    except Exception:
        raise HTTPException(status_code=503, detail="not ready")


_content_cache = {"data": None, "ts": 0.0}


@api_router.get("/content/bundle")
async def content_bundle():
    now = time.time()
    if _content_cache["data"] and now - _content_cache["ts"] < 30:
        return _content_cache["data"]
    singletons = await db.content.find({}, {"_id": 0}).to_list(20)
    by_key = {s["key"]: (s.get("published") or {}) for s in singletons}
    settings = by_key.get("settings", {})
    settings_public = {
        k: v for k, v in settings.items()
        if k in ("brand_name", "legal_name", "tagline", "info_email", "careers_email",
                 "cta_text", "footer_text", "copyright", "seo_title", "seo_description")
    }
    socials = sorted(
        [s for s in settings.get("socials", []) if s.get("enabled")],
        key=lambda s: s.get("order", 99),
    )
    data = {
        "home": by_key.get("home"),
        "about": by_key.get("about"),
        "settings": settings_public,
        "socials": socials,
        "services": await db.cms_services.find({"status": "published"}, {"_id": 0}).to_list(50),
        "solutions": await db.cms_solutions.find({"status": "published"}, {"_id": 0}).to_list(50),
        "projects": await db.cms_projects.find({"status": "published"}, {"_id": 0}).to_list(50),
        "insights": await db.cms_insights.find({"status": "published"}, {"_id": 0}).to_list(100),
        "jobs": await db.jobs.find({"status": "published"}, {"_id": 0, "created_by": 0, "updated_by": 0}).to_list(100),
    }
    _content_cache["data"] = data
    _content_cache["ts"] = now
    return data


@api_router.post("/contact")
async def submit_contact(payload: ContactIn, request: Request):
    if payload.website:
        return {"status": "received", "notified": False}
    _throttle(request.client.host if request.client else "unknown")
    doc = {
        "id": str(uuid.uuid4()),
        "type": "contact",
        "name": payload.name,
        "email": payload.email,
        "company": payload.company,
        "topic": payload.topic,
        "message": payload.message,
        "read": False,
        "status": "new",
        "notes": [],
        "created_at": utcnow(),
    }
    await db.contact_submissions.insert_one(doc)
    notified = False
    try:
        html = _email_table("New website inquiry", [
            ("Name", payload.name),
            ("Email", payload.email),
            ("Company", payload.company or "—"),
            ("Topic", payload.topic),
            ("Message", payload.message),
        ])
        await send_email(to=CONTACT_INBOX, subject=f"[AUTRAXIS] New inquiry — {payload.topic[:60]}", html=html)
        notified = True
    except HTTPException as e:
        logger.warning(f"Contact notification email not sent (submission stored): {e.detail}")
    return {"status": "received", "notified": notified}


@api_router.post("/careers")
async def submit_careers(payload: CareersIn, request: Request):
    if payload.website:
        return {"status": "received", "notified": False}
    _throttle(request.client.host if request.client else "unknown")
    doc = {
        "id": str(uuid.uuid4()),
        "type": "careers",
        "name": payload.name,
        "email": payload.email,
        "role": payload.role,
        "linkedin": payload.linkedin,
        "message": payload.message,
        "read": False,
        "status": "new",
        "notes": [],
        "created_at": utcnow(),
    }
    await db.career_applications.insert_one(doc)
    notified = False
    try:
        html = _email_table("New career application", [
            ("Name", payload.name),
            ("Email", payload.email),
            ("Role", payload.role),
            ("LinkedIn / Portfolio", payload.linkedin or "—"),
            ("Message", payload.message),
        ])
        await send_email(to=CAREERS_INBOX, subject=f"[AUTRAXIS] Career application — {payload.role[:60]}", html=html, reply_to=CAREERS_INBOX)
        notified = True
    except HTTPException as e:
        logger.warning(f"Careers notification email not sent (application stored): {e.detail}")
    return {"status": "received", "notified": notified}


@api_router.post("/analytics/pageview")
async def track_pageview(payload: PageviewIn, request: Request):
    path = payload.path.strip()
    if not path.startswith("/") or path.startswith("//") or path.startswith(("/api", "/admin")):
        return {"status": "ignored"}
    _throttle(f"pv:{request.client.host if request.client else 'unknown'}", limit=120, window=60)
    await db.analytics_pageviews.insert_one({
        "path": path[:200],
        "day": datetime.now(timezone.utc).date().isoformat(),
        "ts": utcnow(),
    })
    return {"status": "ok"}


# ---- Auth routes ----
GENERIC_AUTH_ERROR = "Invalid email or password"


@api_router.post("/auth/login")
async def login(payload: LoginIn, request: Request):
    email = payload.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    now = time.time()
    if attempt and attempt.get("locked_until", 0) > now:
        await audit(db, None, "auth.login_locked", "auth", meta={"email": email}, request=request)
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
    user = await db.users.find_one({"email": email})
    ok = bool(user) and user.get("status") == "active" and verify_password(payload.password, user["password_hash"])
    if not ok:
        count = (attempt.get("count", 0) if attempt else 0) + 1
        update = {"identifier": identifier, "count": count, "last": now}
        if count >= 5:
            update["locked_until"] = now + 900
        await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)
        await audit(db, None, "auth.login_failed", "auth", result="failed", meta={"email": email}, request=request)
        raise HTTPException(status_code=401, detail=GENERIC_AUTH_ERROR)
    await db.login_attempts.delete_one({"identifier": identifier})
    await db.users.update_one({"id": user["id"]}, {"$set": {"last_login": utcnow()}})
    await audit(db, user, "auth.login", "auth", request=request)
    return {"token": create_access_token(user), "user": public_user(user)}


@api_router.post("/auth/logout")
async def logout(request: Request, admin=Depends(get_current_admin)):
    await audit(db, admin, "auth.logout", "auth", request=request)
    return {"status": "ok"}


@api_router.get("/auth/me")
async def me(admin=Depends(get_current_admin)):
    return public_user(admin)


@api_router.post("/auth/change-password")
async def change_password(payload: ChangePasswordIn, request: Request, admin=Depends(get_current_admin)):
    _throttle(f"pw:{request.client.host if request.client else 'unknown'}", limit=10, window=600)
    user = await db.users.find_one({"id": admin["id"]})
    if not user or not verify_password(payload.current_password, user["password_hash"]):
        await audit(db, admin, "auth.password_change_failed", "auth", result="failed", request=request)
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    new_tv = user.get("token_version", 1) + 1
    await db.users.update_one({"id": user["id"]}, {"$set": {
        "password_hash": hash_password(payload.new_password),
        "token_version": new_tv,
        "must_change_password": False,
    }})
    await audit(db, admin, "auth.password_changed", "auth", request=request)
    user["token_version"] = new_tv
    return {"status": "password_updated", "token": create_access_token(user)}


@api_router.post("/auth/forgot-password")
async def forgot_password(payload: ForgotIn, request: Request):
    _throttle(f"fp:{request.client.host if request.client else 'unknown'}", limit=5, window=600,
              detail="Too many requests. Try again later.")
    user = await db.users.find_one({"email": payload.email.lower(), "status": "active"})
    if user:
        token = new_reset_token()
        await db.password_resets.insert_one({
            "user_id": user["id"],
            "token_hash": hash_reset_token(token),
            "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_TTL_MINUTES)).isoformat(),
            "used": False,
            "created_at": utcnow(),
        })
        reset_url = f"{FRONTEND_URL}/admin/reset?token={token}"
        try:
            await send_email(
                to=user["email"],
                subject="[AUTRAXIS] Reset your Control Center password",
                html=(
                    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:24px 0"><tr><td align="center">'
                    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px">'
                    '<tr><td style="padding:24px;font-family:Arial,sans-serif;font-size:18px;font-weight:bold;color:#0F172A">Password reset requested</td></tr>'
                    f'<tr><td style="padding:0 24px 16px;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#334155">A password reset was requested for your AUTRAXIS Control Center account. '
                    f'This link expires in {RESET_TOKEN_TTL_MINUTES} minutes and works once. If you did not request it, ignore this email.</td></tr>'
                    f'<tr><td style="padding:0 24px 24px"><a href="{reset_url}" style="font-family:Arial,sans-serif;font-size:14px;color:#2563EB">Reset your password</a></td></tr>'
                    '</table></td></tr></table>'
                ),
            )
        except HTTPException as e:
            logger.warning(f"Reset email failed: {e.detail}")
        await audit(db, user, "auth.reset_requested", "auth", request=request)
    return {"status": "ok", "message": "If that account exists, a reset link is on its way."}


@api_router.post("/auth/reset-password")
async def reset_password(payload: ResetIn, request: Request):
    record = await db.password_resets.find_one({
        "token_hash": hash_reset_token(payload.token),
        "used": False,
        "expires_at": {"$gt": utcnow()},
    })
    if not record:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired")
    user = await db.users.find_one({"id": record["user_id"]})
    if not user:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired")
    new_tv = user.get("token_version", 1) + 1
    await db.users.update_one({"id": user["id"]}, {"$set": {
        "password_hash": hash_password(payload.new_password),
        "token_version": new_tv,
        "must_change_password": False,
    }})
    await db.password_resets.update_one({"_id": record["_id"]}, {"$set": {"used": True}})
    await audit(db, user, "auth.password_reset", "auth", request=request)
    return {"status": "password_updated"}


app.include_router(api_router)
app.include_router(make_admin_router(db, get_current_admin, require_cap, send_email, metrics, STARTED_AT))


@app.middleware("http")
async def observability_middleware(request: Request, call_next):
    request.state.request_id = uuid.uuid4().hex[:12]
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception as e:
        metrics["err_total"] += 1
        metrics["errors"].append({"ts": utcnow(), "path": request.url.path, "error": type(e).__name__})
        logger.error(f"unhandled error on {request.url.path}: {e}")
        raise
    elapsed = (time.perf_counter() - start) * 1000
    if request.url.path.startswith("/api"):
        metrics["requests"] += 1
        metrics["time_ms"] += elapsed
        metrics["max_ms"] = max(metrics["max_ms"], elapsed)
        if response.status_code >= 500:
            metrics["err_total"] += 1
            metrics["errors"].append({"ts": utcnow(), "path": request.url.path, "error": f"HTTP {response.status_code}"})
    response.headers["X-Request-ID"] = request.state.request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if request.url.path.startswith("/api/admin"):
        response.headers["X-Robots-Tag"] = "noindex, nofollow"
    return response


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
