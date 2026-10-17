# AUTRAXIS auth testing playbook

Admin auth (JWT, Bearer token in Authorization header; token also returned in login response body).

## Credentials
See /app/memory/test_credentials.md (admin email + password).

## Step 1: MongoDB verification
```
mongosh
use test_database
db.users.find({role: "admin"}).pretty()
db.users.findOne({role: "admin"}, {password_hash: 1})
```
Expect: bcrypt hash starting `$2b$`; unique index on users.email; index on login_attempts.identifier; index on analytics_pageviews.day.

## Step 2: API testing
```
TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"<admin email>","password":"<admin password>"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
curl -s http://localhost:8001/api/auth/me -H "Authorization: Bearer $TOKEN"
curl -s "http://localhost:8001/api/admin/submissions?kind=contact" -H "Authorization: Bearer $TOKEN"
curl -s "http://localhost:8001/api/admin/submissions?kind=careers" -H "Authorization: Bearer $TOKEN"
curl -s "http://localhost:8001/api/admin/analytics?days=30" -H "Authorization: Bearer $TOKEN"
```
Expect: login returns token + user; /me returns admin user (no password_hash); submissions lists items; analytics returns totals.

## Step 3: negative tests
- Wrong password → 401 "Invalid email or password"; 5 wrong attempts → 429 lockout (15 min).
- No/invalid token on /api/admin/* → 401.

## Step 4: UI flow
- /admin → sign in with admin creds → lands on /admin/inbox → tabs Inquiries / Applications / Analytics → expand a row, toggle read/unread, sign out → /admin/inbox without token redirects to /admin.
