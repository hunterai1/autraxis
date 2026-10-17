import os
import re
import uuid
import secrets
import hashlib
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

import bcrypt
import jwt
from fastapi import HTTPException, Request, Depends

logger = logging.getLogger("autraxis.security")

JWT_ALGORITHM = "HS256"
TOKEN_TTL_HOURS = 12
RESET_TOKEN_TTL_MINUTES = 30

SENSITIVE_KEYS = {"password", "password_hash", "current_password", "new_password", "confirm",
                  "token", "secret", "jwt", "authorization", "api_key", "reset_token"}

ROLE_CAPS = {
    "super_admin": {"*"},
    "content_admin": {"dashboard:view", "content:read", "content:write"},
    "recruitment_admin": {"dashboard:view", "jobs:read", "jobs:write",
                          "applications:read", "applications:write", "export:data"},
    "ops_admin": {"dashboard:view", "inquiries:read", "inquiries:write",
                  "monitoring:view", "export:data"},
    "viewer": {"dashboard:view", "monitoring:view", "audit:view", "content:read",
               "jobs:read", "inquiries:read", "applications:read"},
}

ROLE_LABELS = {
    "super_admin": "Super Admin",
    "content_admin": "Content Admin",
    "recruitment_admin": "Recruitment Admin",
    "ops_admin": "Operations Admin",
    "viewer": "Viewer / Auditor",
}

ALL_CAPS = sorted({
    "dashboard:view", "content:read", "content:write", "jobs:read", "jobs:write",
    "applications:read", "applications:write", "inquiries:read", "inquiries:write",
    "users:manage", "audit:view", "monitoring:view", "settings:write",
    "security:view", "export:data",
})


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user: dict) -> str:
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "tv": user.get("token_version", 1),
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_TTL_HOURS),
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def new_reset_token() -> str:
    return secrets.token_urlsafe(32)


def user_caps(user: dict) -> set:
    return ROLE_CAPS.get(user.get("role", ""), set())


def has_cap(user: dict, cap: str) -> bool:
    caps = user_caps(user)
    return "*" in caps or cap in caps


def public_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user["role"],
        "status": user.get("status", "active"),
        "caps": sorted(ALL_CAPS if "*" in user_caps(user) else user_caps(user)),
        "must_change_password": bool(user.get("must_change_password")),
        "last_login": user.get("last_login"),
        "created_at": user.get("created_at"),
    }


def make_auth(db):
    async def get_current_admin(request: Request) -> dict:
        auth_header = request.headers.get("Authorization", "")
        token = auth_header[7:] if auth_header.startswith("Bearer ") else None
        if not token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        try:
            payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
            if payload.get("type") != "access":
                raise HTTPException(status_code=401, detail="Invalid token")
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Session expired — please sign in again")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user or user.get("status") != "active":
            raise HTTPException(status_code=401, detail="Not authenticated")
        if payload.get("tv") != user.get("token_version", 1):
            raise HTTPException(status_code=401, detail="Session revoked — please sign in again")
        request.state.admin = user
        return user

    def require_cap(cap: str):
        async def dep(request: Request, admin=Depends(get_current_admin)):
            if not has_cap(admin, cap):
                await audit(db, admin, f"deny:{cap}", result="denied", request=request)
                raise HTTPException(status_code=403, detail="You don't have permission for this action")
            return admin
        return dep

    return get_current_admin, require_cap


async def audit(db, actor: Optional[dict], action: str, resource_type: str = "",
                resource_id: str = "", result: str = "ok", meta: Optional[dict] = None,
                request: Optional[Request] = None) -> None:
    safe_meta = {}
    for k, v in (meta or {}).items():
        if k.lower() in SENSITIVE_KEYS:
            continue
        safe_meta[k] = (str(v)[:300] if not isinstance(v, (int, float, bool)) else v)
    doc = {
        "id": str(uuid.uuid4()),
        "ts": datetime.now(timezone.utc).isoformat(),
        "actor_id": (actor or {}).get("id", ""),
        "actor_email": (actor or {}).get("email", ""),
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "result": result,
        "request_id": getattr(getattr(request, "state", None), "request_id", "") if request else "",
        "meta": safe_meta,
    }
    try:
        await db.audit_logs.insert_one(doc)
    except Exception as e:
        logger.error(f"audit write failed: {e}")


def valid_https_url(url: str) -> bool:
    return bool(re.match(r"^https://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/[^\s]*)?$", url or ""))


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()
