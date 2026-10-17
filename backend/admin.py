import csv
import io
import logging
import os
import re
import secrets
import uuid
import time
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import Response
from pydantic import BaseModel, Field, EmailStr

from security import (
    audit, has_cap, public_user, valid_https_url, utcnow,
    hash_password, verify_password, hash_reset_token, new_reset_token,
    ROLE_CAPS, ROLE_LABELS, RESET_TOKEN_TTL_MINUTES,
)

logger = logging.getLogger("autraxis.admin")

JOB_STATUSES = ["draft", "published", "closed", "archived"]
CMS_STATUSES = ["draft", "published"]
SUBMISSION_STATUSES = ["new", "in_progress", "resolved"]
APPLICATION_STATUSES = ["new", "reviewed", "shortlisted", "rejected"]

COLLECTION_CAPS = {
    "services": ("content:read", "content:write"),
    "solutions": ("content:read", "content:write"),
    "projects": ("content:read", "content:write"),
    "insights": ("content:read", "content:write"),
    "jobs": ("jobs:read", "jobs:write"),
}

COLLECTION_REQUIRED = {
    "services": ["slug", "name", "short", "summary"],
    "solutions": ["id", "industry", "title", "summary"],
    "projects": ["id", "title", "description"],
    "insights": ["slug", "title", "tag", "date", "excerpt"],
    "jobs": ["title", "department", "employment_type", "location", "description"],
}

COLLECTION_DB = {
    "services": "cms_services",
    "solutions": "cms_solutions",
    "projects": "cms_projects",
    "insights": "cms_insights",
    "jobs": "jobs",
}

SINGLETON_CAPS = {
    "home": ("content:read", "content:write"),
    "about": ("content:read", "content:write"),
    "settings": ("content:read", "settings:write"),
}

SOCIAL_PLATFORMS = {"facebook", "x", "youtube", "instagram", "linkedin", "xing", "github"}
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class SingletonIn(BaseModel):
    data: dict
    publish: bool = False


class ItemIn(BaseModel):
    data: dict


class RevertIn(BaseModel):
    index: int = Field(ge=0)


class SubmissionPatch(BaseModel):
    status: Optional[str] = None
    read: Optional[bool] = None
    note: Optional[str] = Field(default=None, max_length=2000)


class InviteIn(BaseModel):
    email: EmailStr
    name: str = Field(min_length=2, max_length=120)
    role: str


class UserPatch(BaseModel):
    role: Optional[str] = None
    status: Optional[str] = None


class ReauthIn(BaseModel):
    password: str = Field(min_length=1, max_length=200)


def make_admin_router(db, get_current_admin, require_cap, send_email, metrics, started_at):
    router = APIRouter(prefix="/api/admin")

    async def _reauth(request: Request, admin: dict):
        pw = request.headers.get("X-Reauth-Password", "")
        full = await db.users.find_one({"id": admin["id"]})
        if not pw or not full or not verify_password(pw, full["password_hash"]):
            raise HTTPException(status_code=403, detail="Re-authentication failed — enter your current password to confirm")

    # ---------- Dashboard ----------
    @router.get("/dashboard")
    async def dashboard(admin=Depends(require_cap("dashboard:view"))):
        out = {"user": public_user(admin)}
        if has_cap(admin, "inquiries:read"):
            out["inquiries"] = {
                "total": await db.contact_submissions.count_documents({}),
                "unread": await db.contact_submissions.count_documents({"read": False}),
                "new": await db.contact_submissions.count_documents({"status": {"$in": ["new", None]}}),
            }
            out["recent_inquiries"] = await db.contact_submissions.find(
                {}, {"_id": 0, "id": 1, "name": 1, "topic": 1, "created_at": 1, "read": 1, "status": 1}
            ).sort("created_at", -1).to_list(5)
        if has_cap(admin, "applications:read"):
            out["applications"] = {
                "total": await db.career_applications.count_documents({}),
                "unread": await db.career_applications.count_documents({"read": False}),
            }
        if has_cap(admin, "jobs:read"):
            out["jobs"] = {s: await db.jobs.count_documents({"status": s}) for s in JOB_STATUSES}
        if has_cap(admin, "content:read"):
            drafts = 0
            for name in COLLECTION_CAPS:
                drafts += await db[COLLECTION_DB[name]].count_documents({"status": "draft"})
            drafts += await db.content.count_documents({"draft": {"$ne": None}})
            out["content"] = {"drafts": drafts}
        if has_cap(admin, "audit:view"):
            out["recent_audit"] = await db.audit_logs.find(
                {}, {"_id": 0}).sort("ts", -1).to_list(8)
        return out

    # ---------- Singleton content ----------
    def _validate_settings(data: dict):
        for key in ("info_email", "careers_email"):
            if key in data and not EMAIL_RE.match(str(data[key])):
                raise HTTPException(status_code=400, detail=f"{key} must be a valid email address")
        if "socials" in data:
            if not isinstance(data["socials"], list):
                raise HTTPException(status_code=400, detail="socials must be a list")
            for s in data["socials"]:
                if s.get("id") not in SOCIAL_PLATFORMS:
                    raise HTTPException(status_code=400, detail=f"Unknown social platform: {s.get('id')}")
                url = str(s.get("url", ""))
                if s.get("enabled") and not valid_https_url(url):
                    raise HTTPException(status_code=400, detail=f"{s.get('id')} URL must be a valid https:// link")
                if url and not valid_https_url(url):
                    raise HTTPException(status_code=400, detail=f"{s.get('id')} URL must be a valid https:// link")

    @router.get("/content")
    async def list_content(admin=Depends(require_cap("content:read"))):
        singletons = await db.content.find({}, {"_id": 0, "key": 1, "draft": 1, "updated_by": 1, "updated_at": 1, "revisions": 1}).to_list(50)
        return {
            "singletons": [{
                "key": s["key"],
                "has_draft": s.get("draft") is not None,
                "revisions": len(s.get("revisions", [])),
                "updated_by": s.get("updated_by"),
                "updated_at": s.get("updated_at"),
            } for s in singletons],
        }

    @router.get("/content/{key}")
    async def get_content(key: str, admin=Depends(require_cap("content:read"))):
        if key not in SINGLETON_CAPS:
            raise HTTPException(status_code=404, detail="Unknown content key")
        doc = await db.content.find_one({"key": key}, {"_id": 0})
        if not doc:
            raise HTTPException(status_code=404, detail="Content not found")
        return doc

    @router.put("/content/{key}")
    async def put_content(key: str, payload: SingletonIn, request: Request, admin=Depends(get_current_admin)):
        if key not in SINGLETON_CAPS:
            raise HTTPException(status_code=404, detail="Unknown content key")
        _, write_cap = SINGLETON_CAPS[key]
        if not has_cap(admin, write_cap):
            await audit(db, admin, f"deny:{write_cap}", "content", key, "denied", request=request)
            raise HTTPException(status_code=403, detail="You don't have permission for this action")
        if not isinstance(payload.data, dict) or not payload.data:
            raise HTTPException(status_code=400, detail="Content data must be a non-empty object")
        if key == "settings":
            _validate_settings(payload.data)
        doc = await db.content.find_one({"key": key})
        if not doc:
            raise HTTPException(status_code=404, detail="Content not found")
        update = {"draft": payload.data, "updated_by": admin["email"], "updated_at": utcnow()}
        action = "content.draft_saved"
        if payload.publish:
            revisions = doc.get("revisions", [])
            if doc.get("published") is not None:
                revisions = (revisions + [{"data": doc["published"], "by": doc.get("updated_by", ""), "at": doc.get("updated_at", "")}])[-15:]
            update.update({"published": payload.data, "draft": None, "revisions": revisions})
            action = "content.published"
        await db.content.update_one({"key": key}, {"$set": update})
        await audit(db, admin, action, "content", key, meta={"fields": sorted(payload.data.keys())}, request=request)
        return {"status": "published" if payload.publish else "draft_saved"}

    @router.post("/content/{key}/revert")
    async def revert_content(key: str, payload: RevertIn, request: Request, admin=Depends(get_current_admin)):
        if key not in SINGLETON_CAPS:
            raise HTTPException(status_code=404, detail="Unknown content key")
        _, write_cap = SINGLETON_CAPS[key]
        if not has_cap(admin, write_cap):
            raise HTTPException(status_code=403, detail="You don't have permission for this action")
        doc = await db.content.find_one({"key": key})
        if not doc:
            raise HTTPException(status_code=404, detail="Content not found")
        revisions = doc.get("revisions", [])
        try:
            rev = revisions[payload.index]
        except IndexError:
            raise HTTPException(status_code=404, detail="Revision not found")
        new_revisions = (revisions + [{"data": doc["published"], "by": doc.get("updated_by", ""), "at": doc.get("updated_at", "")}])[-15:]
        await db.content.update_one({"key": key}, {"$set": {
            "published": rev["data"], "draft": None, "revisions": new_revisions,
            "updated_by": admin["email"], "updated_at": utcnow(),
        }})
        await audit(db, admin, "content.reverted", "content", key, meta={"revision_index": payload.index}, request=request)
        return {"status": "reverted"}

    # ---------- CMS collections ----------
    def _check_item(name: str, data: dict):
        for field in COLLECTION_REQUIRED[name]:
            if not str(data.get(field, "")).strip():
                raise HTTPException(status_code=400, detail=f"'{field}' is required")
        status = data.get("status", "draft")
        allowed = JOB_STATUSES if name == "jobs" else CMS_STATUSES
        if status not in allowed:
            raise HTTPException(status_code=400, detail=f"status must be one of: {', '.join(allowed)}")
        if name == "jobs" and data.get("closing_date"):
            try:
                datetime.fromisoformat(str(data["closing_date"]))
            except ValueError:
                raise HTTPException(status_code=400, detail="closing_date must be ISO format (YYYY-MM-DD)")

    @router.get("/collection/{name}")
    async def list_items(name: str, status: str = "", q: str = "", page: int = 1, admin=Depends(get_current_admin)):
        if name not in COLLECTION_CAPS:
            raise HTTPException(status_code=404, detail="Unknown collection")
        if not has_cap(admin, COLLECTION_CAPS[name][0]):
            raise HTTPException(status_code=403, detail="You don't have permission for this action")
        query: dict = {}
        if status:
            query["status"] = status
        if q:
            rx = {"$regex": re.escape(q), "$options": "i"}
            query["$or"] = [{"title": rx}, {"name": rx}, {"slug": rx}]
        page = max(1, page)
        size = 20
        coll = db[COLLECTION_DB[name]]
        total = await coll.count_documents(query)
        items = await coll.find(query, {"_id": 0}).sort("updated_at", -1).skip((page - 1) * size).limit(size).to_list(size)
        return {"items": items, "total": total, "page": page, "pages": max(1, (total + size - 1) // size)}

    @router.post("/collection/{name}")
    async def create_item(name: str, payload: ItemIn, request: Request, admin=Depends(get_current_admin)):
        if name not in COLLECTION_CAPS:
            raise HTTPException(status_code=404, detail="Unknown collection")
        if not has_cap(admin, COLLECTION_CAPS[name][1]):
            raise HTTPException(status_code=403, detail="You don't have permission for this action")
        _check_item(name, payload.data)
        coll = db[COLLECTION_DB[name]]
        slug = payload.data.get("slug") or payload.data.get("id")
        if slug and await coll.find_one({"$or": [{"slug": slug}, {"id": slug}]}):
            raise HTTPException(status_code=400, detail="An item with this slug/id already exists")
        item = dict(payload.data)
        item.update({"id": slug or str(uuid.uuid4()), "created_by": admin["email"],
                     "updated_by": admin["email"], "created_at": utcnow(), "updated_at": utcnow()})
        item.setdefault("status", "draft")
        await coll.insert_one(item)
        await audit(db, admin, f"{name}.created", name, item["id"], meta={"title": item.get("title") or item.get("name")}, request=request)
        item.pop("_id", None)
        return item

    @router.put("/collection/{name}/{item_id}")
    async def update_item(name: str, item_id: str, payload: ItemIn, request: Request, admin=Depends(get_current_admin)):
        if name not in COLLECTION_CAPS:
            raise HTTPException(status_code=404, detail="Unknown collection")
        if not has_cap(admin, COLLECTION_CAPS[name][1]):
            raise HTTPException(status_code=403, detail="You don't have permission for this action")
        coll = db[COLLECTION_DB[name]]
        existing = await coll.find_one({"id": item_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Item not found")
        merged = {**existing, **payload.data, "id": item_id}
        _check_item(name, merged)
        merged.update({"updated_by": admin["email"], "updated_at": utcnow()})
        merged.pop("_id", None)
        await coll.replace_one({"id": item_id}, merged)
        await audit(db, admin, f"{name}.updated", name, item_id, meta={"status": merged.get("status")}, request=request)
        return merged

    @router.delete("/collection/{name}/{item_id}")
    async def delete_item(name: str, item_id: str, request: Request, admin=Depends(get_current_admin)):
        if name not in COLLECTION_CAPS:
            raise HTTPException(status_code=404, detail="Unknown collection")
        if not has_cap(admin, COLLECTION_CAPS[name][1]):
            raise HTTPException(status_code=403, detail="You don't have permission for this action")
        result = await db[COLLECTION_DB[name]].delete_one({"id": item_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Item not found")
        await audit(db, admin, f"{name}.deleted", name, item_id, request=request)
        return {"status": "deleted"}

    # ---------- Submissions (inquiries / applications) ----------
    SUBMISSION_SOURCES = {
        "contact": ("contact_submissions", "inquiries:read", "inquiries:write", SUBMISSION_STATUSES),
        "careers": ("career_applications", "applications:read", "applications:write", APPLICATION_STATUSES),
    }

    @router.get("/submissions2/{kind}")
    async def list_submissions(kind: str, q: str = "", status: str = "", page: int = 1, admin=Depends(get_current_admin)):
        src = SUBMISSION_SOURCES.get(kind)
        if not src:
            raise HTTPException(status_code=404, detail="Unknown submission kind")
        if not has_cap(admin, src[1]):
            raise HTTPException(status_code=403, detail="You don't have permission for this action")
        coll_name, _, _, _ = src
        query: dict = {}
        if q:
            rx = {"$regex": re.escape(q), "$options": "i"}
            query["$or"] = [{"name": rx}, {"email": rx}, {"topic": rx}, {"role": rx}]
        if status:
            query["status"] = status
        page = max(1, page)
        size = 20
        total = await db[coll_name].count_documents(query)
        items = await db[coll_name].find(query, {"_id": 0}).sort("created_at", -1).skip((page - 1) * size).limit(size).to_list(size)
        unread = await db[coll_name].count_documents({"read": False})
        return {"items": items, "total": total, "page": page, "pages": max(1, (total + size - 1) // size), "unread": unread}

    @router.patch("/submissions/{kind}/{sid}")
    async def patch_submission(kind: str, sid: str, payload: SubmissionPatch, request: Request, admin=Depends(get_current_admin)):
        src = SUBMISSION_SOURCES.get(kind)
        if not src:
            raise HTTPException(status_code=404, detail="Unknown submission kind")
        if not has_cap(admin, src[2]):
            raise HTTPException(status_code=403, detail="You don't have permission for this action")
        coll_name, _, _, statuses = src
        update = {}
        if payload.status is not None:
            if payload.status not in statuses:
                raise HTTPException(status_code=400, detail=f"status must be one of: {', '.join(statuses)}")
            update["status"] = payload.status
        if payload.read is not None:
            update["read"] = payload.read
        push = None
        if payload.note:
            push = {"notes": {"by": admin["email"], "at": utcnow(), "text": payload.note}}
        if not update and not push:
            raise HTTPException(status_code=400, detail="Nothing to update")
        q = {"id": sid}
        update_doc = {}
        if update:
            update_doc["$set"] = update
        if push:
            update_doc["$push"] = push
        result = await db[coll_name].update_one(q, update_doc)
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Submission not found")
        await audit(db, admin, f"{kind}.submission_updated", kind, sid, meta={"fields": list(update) + (["note"] if push else [])}, request=request)
        return {"status": "ok"}

    @router.delete("/submissions/{kind}/{sid}")
    async def delete_submission(kind: str, sid: str, request: Request, admin=Depends(get_current_admin)):
        src = SUBMISSION_SOURCES.get(kind)
        if not src:
            raise HTTPException(status_code=404, detail="Unknown submission kind")
        if not has_cap(admin, src[2]):
            raise HTTPException(status_code=403, detail="You don't have permission for this action")
        result = await db[src[0]].delete_one({"id": sid})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Submission not found")
        await audit(db, admin, f"{kind}.submission_deleted", kind, sid, request=request)
        return {"status": "deleted"}

    @router.get("/submissions/{kind}/export")
    async def export_submissions(kind: str, request: Request, admin=Depends(get_current_admin)):
        src = SUBMISSION_SOURCES.get(kind)
        if not src:
            raise HTTPException(status_code=404, detail="Unknown submission kind")
        if not has_cap(admin, "export:data") or not has_cap(admin, src[1]):
            await audit(db, admin, "deny:export", kind, result="denied", request=request)
            raise HTTPException(status_code=403, detail="You don't have permission to export data")
        docs = await db[src[0]].find({}, {"_id": 0, "notes": 0}).sort("created_at", -1).to_list(5000)
        buf = io.StringIO()
        fields = ["id", "created_at", "name", "email", "company", "topic", "role", "linkedin", "status", "read"]
        writer = csv.DictWriter(buf, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        for d in docs:
            writer.writerow(d)
        await audit(db, admin, f"{kind}.exported", kind, meta={"rows": len(docs)}, request=request)
        return Response(
            buf.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="autraxis-{kind}-submissions.csv"'},
        )

    # ---------- User management ----------
    async def _send_setup_email(email: str, name: str, token: str) -> bool:
        base = os.environ.get("FRONTEND_URL", "").rstrip("/")
        setup_url = f"{base}/admin/reset?token={token}"
        html = (
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:24px 0"><tr><td align="center">'
            '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px">'
            '<tr><td style="padding:24px;font-family:Arial,sans-serif;font-size:18px;font-weight:bold;color:#0F172A">AUTRAXIS Control Center access</td></tr>'
            f'<tr><td style="padding:0 24px 16px;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#334155">Hello {name}, an administrator account was created for you. '
            f'This link expires in {RESET_TOKEN_TTL_MINUTES} minutes and works once.</td></tr>'
            f'<tr><td style="padding:0 24px 24px"><a href="{setup_url}" style="font-family:Arial,sans-serif;font-size:14px;color:#2563EB">Set up your administrator account</a></td></tr>'
            '<tr><td style="padding:16px 24px;font-family:Arial,sans-serif;font-size:12px;color:#94A3B8;border-top:1px solid #E2E8F0">If you did not expect this email, ignore it — the link will expire.</td></tr>'
            '</table></td></tr></table>'
        )
        try:
            await send_email(to=email, subject="[AUTRAXIS] Your Control Center account", html=html)
            return True
        except HTTPException:
            return False

    @router.get("/users")
    async def list_users(admin=Depends(require_cap("users:manage"))):
        users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", 1).to_list(200)
        return {"items": [public_user(u) for u in users], "roles": ROLE_LABELS}

    @router.post("/users/invite")
    async def invite_user(payload: InviteIn, request: Request, admin=Depends(require_cap("users:manage"))):
        email = payload.email.lower()
        if payload.role not in ROLE_CAPS:
            raise HTTPException(status_code=400, detail=f"role must be one of: {', '.join(ROLE_CAPS)}")
        if await db.users.find_one({"email": email}):
            raise HTTPException(status_code=400, detail="A user with this email already exists")
        token = new_reset_token()
        user = {
            "id": str(uuid.uuid4()),
            "email": email,
            "name": payload.name,
            "role": payload.role,
            "status": "active",
            "password_hash": hash_password(secrets.token_urlsafe(18)),
            "must_change_password": True,
            "token_version": 1,
            "created_at": utcnow(),
            "created_by": admin["email"],
        }
        await db.users.insert_one(user)
        await db.password_resets.insert_one({
            "user_id": user["id"], "token_hash": hash_reset_token(token),
            "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_TTL_MINUTES)).isoformat(),
            "used": False, "created_at": utcnow(),
        })
        emailed = await _send_setup_email(email, payload.name, token)
        await audit(db, admin, "user.invited", "user", user["id"], meta={"email": email, "role": payload.role, "emailed": emailed}, request=request)
        out = {"status": "invited", "email_sent": emailed, "user": public_user(user)}
        if not emailed:
            base = os.environ.get("FRONTEND_URL", "").rstrip("/")
            out["setup_url"] = f"{base}/admin/reset?token={token}"
            out["note"] = "Email delivery failed — share this one-time setup link manually."
        return out

    @router.patch("/users/{uid}")
    async def patch_user(uid: str, payload: UserPatch, request: Request, admin=Depends(require_cap("users:manage"))):
        await _reauth(request, admin)
        target = await db.users.find_one({"id": uid})
        if not target:
            raise HTTPException(status_code=404, detail="User not found")
        update = {}
        changes = {}
        if payload.role is not None:
            if payload.role not in ROLE_CAPS:
                raise HTTPException(status_code=400, detail="Unknown role")
            if uid == admin["id"]:
                raise HTTPException(status_code=400, detail="You cannot change your own role")
            if target["role"] == "super_admin" and payload.role != "super_admin":
                others = await db.users.count_documents({"role": "super_admin", "status": "active", "id": {"$ne": uid}})
                if others == 0:
                    raise HTTPException(status_code=400, detail="Cannot demote the last active super admin")
            update["role"] = payload.role
            changes["role"] = {"from": target["role"], "to": payload.role}
        if payload.status is not None:
            if payload.status not in ("active", "suspended"):
                raise HTTPException(status_code=400, detail="status must be active or suspended")
            if uid == admin["id"]:
                raise HTTPException(status_code=400, detail="You cannot suspend your own account")
            if payload.status == "suspended" and target["role"] == "super_admin":
                others = await db.users.count_documents({"role": "super_admin", "status": "active", "id": {"$ne": uid}})
                if others == 0:
                    raise HTTPException(status_code=400, detail="Cannot suspend the last active super admin")
            update["status"] = payload.status
            changes["status"] = {"from": target.get("status", "active"), "to": payload.status}
            if payload.status == "suspended":
                update["token_version"] = target.get("token_version", 1) + 1
        if not update:
            raise HTTPException(status_code=400, detail="Nothing to update")
        await db.users.update_one({"id": uid}, {"$set": update})
        await audit(db, admin, "user.updated", "user", uid, meta={"email": target["email"], "changes": changes}, request=request)
        return {"status": "updated"}

    @router.post("/users/{uid}/revoke-sessions")
    async def revoke_sessions(uid: str, request: Request, admin=Depends(require_cap("users:manage"))):
        await _reauth(request, admin)
        target = await db.users.find_one({"id": uid})
        if not target:
            raise HTTPException(status_code=404, detail="User not found")
        await db.users.update_one({"id": uid}, {"$set": {"token_version": target.get("token_version", 1) + 1}})
        await audit(db, admin, "user.sessions_revoked", "user", uid, meta={"email": target["email"]}, request=request)
        return {"status": "sessions_revoked"}

    @router.post("/users/{uid}/reset-link")
    async def send_reset_link(uid: str, request: Request, admin=Depends(require_cap("users:manage"))):
        target = await db.users.find_one({"id": uid})
        if not target:
            raise HTTPException(status_code=404, detail="User not found")
        token = new_reset_token()
        await db.password_resets.insert_one({
            "user_id": uid, "token_hash": hash_reset_token(token),
            "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_TTL_MINUTES)).isoformat(),
            "used": False, "created_at": utcnow(),
        })
        emailed = await _send_setup_email(target["email"], target.get("name", ""), token)
        await audit(db, admin, "user.reset_link_sent", "user", uid, meta={"email": target["email"], "emailed": emailed}, request=request)
        out = {"status": "sent" if emailed else "email_failed"}
        if not emailed:
            base = os.environ.get("FRONTEND_URL", "").rstrip("/")
            out["setup_url"] = f"{base}/admin/reset?token={token}"
        return out

    # ---------- Audit logs ----------
    @router.get("/audit-logs")
    async def list_audit(actor: str = "", action: str = "", result: str = "",
                         date_from: str = "", date_to: str = "", page: int = 1,
                         admin=Depends(require_cap("audit:view"))):
        query: dict = {}
        if actor:
            query["actor_email"] = {"$regex": re.escape(actor), "$options": "i"}
        if action:
            query["action"] = {"$regex": re.escape(action), "$options": "i"}
        if result:
            query["result"] = result
        if date_from:
            query["ts"] = {"$gte": date_from}
        if date_to:
            query.setdefault("ts", {})["$lte"] = date_to + "T23:59:59" if len(date_to) == 10 else date_to
        page = max(1, page)
        size = 50
        total = await db.audit_logs.count_documents(query)
        items = await db.audit_logs.find(query, {"_id": 0}).sort("ts", -1).skip((page - 1) * size).limit(size).to_list(size)
        return {"items": items, "total": total, "page": page, "pages": max(1, (total + size - 1) // size)}

    @router.get("/audit-export")
    async def export_audit(request: Request, admin=Depends(require_cap("audit:view"))):
        docs = await db.audit_logs.find({}, {"_id": 0}).sort("ts", -1).to_list(10000)
        buf = io.StringIO()
        fields = ["ts", "actor_email", "action", "resource_type", "resource_id", "result", "request_id"]
        writer = csv.DictWriter(buf, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        for d in docs:
            writer.writerow(d)
        await audit(db, admin, "audit.exported", "audit", meta={"rows": len(docs)}, request=request)
        return Response(buf.getvalue(), media_type="text/csv",
                        headers={"Content-Disposition": 'attachment; filename="autraxis-audit-log.csv"'})

    # ---------- Monitoring ----------
    @router.get("/monitoring")
    async def monitoring(admin=Depends(require_cap("monitoring:view"))):
        result = {"checked_at": utcnow(), "version": os.environ.get("APP_VERSION", "dev")}
        result["api"] = {"status": "healthy", "uptime_seconds": int(time.time() - started_at)}
        start = time.perf_counter()
        try:
            await db.command("ping")
            ms = round((time.perf_counter() - start) * 1000, 1)
            result["database"] = {"status": "healthy" if ms < 500 else "degraded", "ping_ms": ms}
        except Exception:
            result["database"] = {"status": "down", "ping_ms": None}
        ops = await db.ops_state.find_one({"key": "last_email"}, {"_id": 0}) or {}
        email_key_present = bool(os.environ.get("EMERGENT_EMAIL_KEY"))
        last = ops.get("value")
        if not email_key_present:
            email_state = "not_configured"
        elif not last:
            email_state = "unknown"
        else:
            email_state = "healthy" if last.get("ok") else "degraded"
        result["email"] = {
            "status": email_state,
            "last_attempt": (last or {}).get("ts"),
            "note": "Last send attempt result recorded by the server; no send has occurred yet" if not last else "",
        }
        avg = round(metrics["time_ms"] / metrics["requests"], 1) if metrics["requests"] else 0
        result["traffic"] = {
            "requests_since_start": metrics["requests"],
            "avg_response_ms": avg,
            "max_response_ms": round(metrics["max_ms"], 1),
            "errors_since_start": metrics["err_total"],
            "pageviews_total": await db.analytics_pageviews.count_documents({}),
        }
        result["recent_errors"] = list(metrics["errors"])[-10:]
        result["counts"] = {
            "inquiries": await db.contact_submissions.count_documents({}),
            "applications": await db.career_applications.count_documents({}),
            "jobs_published": await db.jobs.count_documents({"status": "published"}),
            "audit_events": await db.audit_logs.count_documents({}),
        }
        return result

    # ---------- Security overview ----------
    @router.get("/security/overview")
    async def security_overview(admin=Depends(require_cap("dashboard:view"))):
        now = time.time()
        lockouts = await db.login_attempts.count_documents({"locked_until": {"$gt": now}})
        attempts = await db.login_attempts.count_documents({})
        my_events = await db.audit_logs.find(
            {"actor_email": admin["email"]}, {"_id": 0}).sort("ts", -1).to_list(10)
        return {
            "active_lockouts": lockouts,
            "tracked_failed_attempt_sources": attempts,
            "session_policy": {"token_ttl_hours": 12, "storage": "bearer_token", "csrf": "not_applicable_bearer_auth"},
            "mfa": {"status": "not_configured", "note": "TOTP MFA is planned but not enabled in this build"},
            "my_last_login": admin.get("last_login"),
            "my_recent_events": my_events,
        }

    return router
