from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
from typing import Optional
from datetime import datetime, timezone, timedelta, date
import os
import re
import time
import ipaddress
import logging
import uuid
import httpx
import bcrypt
import jwt

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

JWT_ALGORITHM = "HS256"


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


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
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Admin user seeded")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password reconciled with env")


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.analytics_pageviews.create_index("day")
    await seed_admin()


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
        return resp.json().get("id")
    except httpx.HTTPStatusError as e:
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


class ReadIn(BaseModel):
    read: bool


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


# ---- Auth helpers ----
async def get_current_admin(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    token = auth_header[7:] if auth_header.startswith("Bearer ") else None
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired — please sign in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ---- Public routes ----
@api_router.get("/")
async def root():
    return {"service": "AUTRAXIS API", "status": "ok"}


@api_router.get("/health")
async def health():
    return {"status": "ok", "service": "autraxis-api", "time": datetime.now(timezone.utc).isoformat()}


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
        "created_at": datetime.now(timezone.utc).isoformat(),
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
        "created_at": datetime.now(timezone.utc).isoformat(),
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
        "day": date.today().isoformat(),
        "ts": datetime.now(timezone.utc).isoformat(),
    })
    return {"status": "ok"}


# ---- Auth routes ----
@api_router.post("/auth/login")
async def login(payload: LoginIn, request: Request):
    email = payload.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    now = time.time()
    if attempt and attempt.get("locked_until", 0) > now:
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
    user = await db.users.find_one({"email": email})
    ok = bool(user) and verify_password(payload.password, user["password_hash"])
    if not ok:
        count = (attempt.get("count", 0) if attempt else 0) + 1
        update = {"identifier": identifier, "count": count, "last": now}
        if count >= 5:
            update["locked_until"] = now + 900
        await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"identifier": identifier})
    return {
        "token": create_access_token(user["id"], email),
        "user": {"email": email, "name": user.get("name", "Admin"), "role": user["role"]},
    }


@api_router.get("/auth/me")
async def me(admin=Depends(get_current_admin)):
    return admin


# ---- Admin routes ----
_KIND_TO_COLLECTION = {"contact": "contact_submissions", "careers": "career_applications"}


@api_router.get("/admin/submissions")
async def list_submissions(kind: str = "contact", admin=Depends(get_current_admin)):
    coll_name = _KIND_TO_COLLECTION.get(kind)
    if not coll_name:
        raise HTTPException(status_code=400, detail="kind must be 'contact' or 'careers'")
    docs = await db[coll_name].find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    unread = await db[coll_name].count_documents({"read": False})
    return {"items": docs, "unread": unread, "total": len(docs)}


@api_router.patch("/admin/submissions/{kind}/{sid}/read")
async def mark_read(kind: str, sid: str, payload: ReadIn, admin=Depends(get_current_admin)):
    coll_name = _KIND_TO_COLLECTION.get(kind)
    if not coll_name:
        raise HTTPException(status_code=400, detail="kind must be 'contact' or 'careers'")
    result = await db[coll_name].update_one({"id": sid}, {"$set": {"read": payload.read}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"status": "ok"}


@api_router.get("/admin/analytics")
async def analytics(days: int = 30, admin=Depends(get_current_admin)):
    days = max(1, min(days, 365))
    cutoff = (date.today() - timedelta(days=days)).isoformat()
    docs = await db.analytics_pageviews.find({"day": {"$gte": cutoff}}, {"_id": 0}).to_list(100000)
    by_path: dict = {}
    by_day: dict = {}
    for d in docs:
        by_path[d["path"]] = by_path.get(d["path"], 0) + 1
        by_day[d["day"]] = by_day.get(d["day"], 0) + 1
    return {
        "days": days,
        "total": len(docs),
        "by_path": sorted(([{"path": k, "views": v} for k, v in by_path.items()]), key=lambda x: -x["views"])[:20],
        "by_day": sorted(([{"day": k, "views": v} for k, v in by_day.items()]), key=lambda x: x["day"])[-14:],
    }


app.include_router(api_router)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
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
