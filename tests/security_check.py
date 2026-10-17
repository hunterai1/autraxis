#!/usr/bin/env python3
"""AUTRAXIS Control Center — security & access-control checks.

Run: python3 tests/security_check.py
Requires: backend running on http://localhost:8001 and ADMIN credentials in backend/.env.
Creates two temporary users (viewer, content_admin), runs the authorization matrix,
and cleans them up afterwards. Prints PASS/FAIL per check and exits non-zero on failure.
"""
import os
import sys
import uuid
from datetime import datetime, timezone

import bcrypt
import httpx
import pymongo

API = os.environ.get("API_URL", "http://localhost:8001/api")

_env_path = os.path.join(os.path.dirname(__file__), "..", "backend", ".env")
if os.path.exists(_env_path):
    for line in open(_env_path):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip().strip('"'))

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "info@autraxis.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")

VIEWER = {"email": "sectest-viewer@autraxis-test.com", "password": "SecTest-Viewer-2026!", "role": "viewer"}
CONTENT = {"email": "sectest-content@autraxis-test.com", "password": "SecTest-Content-2026!", "role": "content_admin"}

results = []


def check(name, cond):
    results.append((name, bool(cond)))
    print(f"{'PASS' if cond else 'FAIL'}  {name}")


def login(client, email, password):
    r = client.post(f"{API}/auth/login", json={"email": email, "password": password})
    return r.json().get("token") if r.status_code == 200 else None


def main():
    db = pymongo.MongoClient(MONGO_URL)[DB_NAME]
    for u in (VIEWER, CONTENT):
        db.users.delete_one({"email": u["email"]})
        db.users.insert_one({
            "id": str(uuid.uuid4()), "email": u["email"],
            "password_hash": bcrypt.hashpw(u["password"].encode(), bcrypt.gensalt()).decode(),
            "name": "Security Test", "role": u["role"], "status": "active",
            "must_change_password": False, "token_version": 1,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    try:
        with httpx.Client(timeout=20) as client:
            sup = login(client, ADMIN_EMAIL, ADMIN_PASSWORD)
            vie = login(client, VIEWER["email"], VIEWER["password"])
            con = login(client, CONTENT["email"], CONTENT["password"])
            auth = lambda t: {"Authorization": f"Bearer {t}"}

            check("super admin login works", sup)
            check("viewer login works", vie)
            check("content admin login works", con)

            check("unauthenticated admin API rejected (401)",
                  client.get(f"{API}/admin/dashboard").status_code == 401)
            check("garbage token rejected (401)",
                  client.get(f"{API}/admin/dashboard", headers=auth("not-a-token")).status_code == 401)

            check("viewer cannot list users (403)",
                  client.get(f"{API}/admin/users", headers=auth(vie)).status_code == 403)
            check("viewer cannot write content (403)",
                  client.put(f"{API}/admin/content/home", headers=auth(vie), json={"data": {"x": 1}}).status_code == 403)
            check("viewer cannot export data (403)",
                  client.get(f"{API}/admin/submissions/contact/export", headers=auth(vie)).status_code == 403)
            check("viewer can read monitoring (200)",
                  client.get(f"{API}/admin/monitoring", headers=auth(vie)).status_code == 200)
            check("viewer can read audit logs (200)",
                  client.get(f"{API}/admin/audit-logs", headers=auth(vie)).status_code == 200)

            check("content admin cannot manage users (403)",
                  client.get(f"{API}/admin/users", headers=auth(con)).status_code == 403)
            check("content admin cannot write settings (403)",
                  client.put(f"{API}/admin/content/settings", headers=auth(con),
                             json={"data": {"info_email": "info@autraxis.com"}}).status_code == 403)
            check("content admin cannot create jobs (403)",
                  client.post(f"{API}/admin/collection/jobs", headers=auth(con),
                              json={"data": {"title": "X", "department": "Y", "employment_type": "Z",
                                             "location": "R", "description": "test posting"}}).status_code == 403)

            check("role change without re-auth password rejected (403)",
                  client.patch(f"{API}/admin/users/x", headers=auth(sup), json={"role": "viewer"}).status_code == 403)

            check("wrong login rejected (401, generic message)",
                  (lambda r: r.status_code == 401 and r.json()["detail"] == "Invalid email or password")(
                      client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "definitely-wrong"})))

            check("bad reset token rejected (400)",
                  client.post(f"{API}/auth/reset-password",
                              json={"token": "invalid-token-xyz", "new_password": "WhateverPass2026!"}).status_code == 400)

            check("forgot-password never reveals account existence (200 either way)",
                  client.post(f"{API}/auth/forgot-password", json={"email": "ghost@nowhere-example.com"}).status_code == 200)

            check("public bundle exposes no sensitive fields",
                  not any(k in client.get(f"{API}/content/bundle").json()
                          for k in ("users", "password_hash", "audit")))

            check("admin API responses carry noindex header",
                  client.get(f"{API}/admin/dashboard", headers=auth(sup)).headers.get("x-robots-tag") == "noindex, nofollow")
    finally:
        for u in (VIEWER, CONTENT):
            db.users.delete_one({"email": u["email"]})
        db.login_attempts.delete_many({"identifier": {"$regex": "autraxis-test.com"}})

    failed = [n for n, ok in results if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
    if failed:
        print("FAILED:", *failed, sep="\n  - ")
        sys.exit(1)


if __name__ == "__main__":
    main()
