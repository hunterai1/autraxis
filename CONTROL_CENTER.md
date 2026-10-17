# AUTRAXIS Control Center — Architecture & Operations

The Control Center is a separate, protected area of the existing AUTRAXIS app. The public website is unchanged in design and routing; admin lives under `/admin/*` with its own layout, and every admin API is enforced server-side.

## Routes
| Route | Purpose | Capability required |
|---|---|---|
| /admin/login, /admin/forgot, /admin/reset | Public auth screens | none |
| /admin | Dashboard (per-role summary cards) | dashboard:view |
| /admin/inquiries · /admin/applications | Submission management (search, filter, status, notes, delete, CSV export) | inquiries / applications read+write |
| /admin/content · /admin/content/home · /admin/content/about | Singleton content editors (draft → publish, revisions) | content:read / content:write |
| /admin/collection/services · solutions · projects · insights · jobs | Collection managers (CRUD + status lifecycle) | content / jobs read+write |
| /admin/users | Invite, role change, suspend, revoke sessions, reset links | users:manage (super admin) |
| /admin/audit | Append-only audit log with filters + export | audit:view |
| /admin/monitoring | Real health: API, DB ping, email last-send, traffic, errors | monitoring:view |
| /admin/settings | Brand, emails, socials, footer, SEO | settings:write |
| /admin/security | Change password, posture, own security events | any admin |

Admin pages set `noindex, nofollow` (meta + `X-Robots-Tag` on admin API responses) and robots.txt disallows `/admin`. Admin links are not in public navigation or footer. Note: noindex is not access control — the backend enforces auth.

## Roles & capabilities (server-enforced in `backend/security.py`)
- **super_admin**: everything (`*`)
- **content_admin**: content read/write
- **recruitment_admin**: jobs + applications read/write, export
- **ops_admin**: inquiries read/write, monitoring, export
- **viewer**: read-only monitoring, audit, content, jobs, submissions

`require_cap()` dependencies enforce capabilities on every admin endpoint; denied attempts are audit-logged. Client-side menu filtering is UX only.

## Authentication & sessions
- bcrypt password hashing; JWT Bearer tokens (12 h), stored in localStorage, sent as `Authorization` header. No cookies → CSRF not applicable (documented on the Security page).
- `token_version` per user: incremented on password change, suspension, and explicit session revocation → old tokens die.
- Login lockout: 5 failed attempts per IP+email → 15-minute lockout. Generic "Invalid email or password" errors.
- Password reset: single-use, 30-minute, SHA-256-hashed tokens emailed via the managed mail provider. Forgot-password always returns the same response.
- First admin bootstrap: `ADMIN_EMAIL` + `ADMIN_PASSWORD` env vars, seeded only when the account does not exist. The env password is NOT re-applied after in-app changes.
- Invites never email passwords: a one-time setup link is sent instead; if email delivery fails the super admin gets a copyable link.
- Sensitive user actions (role change, suspend, revoke) require `X-Reauth-Password` re-authentication. The last active super admin cannot be demoted or suspended; self role-change/suspension is blocked.
- MFA (TOTP): NOT implemented in this build — tracked as a limitation.

## Content model (single source of truth = MongoDB)
- `content` collection: singleton docs (`home`, `about`, `settings`) with `published`, `draft`, `revisions` (last 15 published snapshots, restorable).
- `cms_services`, `cms_solutions`, `cms_projects`, `cms_insights`, `jobs` collections with `status` (draft/published, jobs also closed/archived).
- Public site reads `GET /api/content/bundle` (30 s server cache) with build-time fallbacks, so the site renders identically if the API is unreachable.
- Settings changes to displayed emails do NOT touch Zoho Mail/DNS — the UI states this explicitly.
- Seed: `backend/seeds.py` + `backend/seed_content.json` run only when collections are empty.

## Audit logging
`audit_logs` collection, append-only (no update/delete endpoints exist). Records actor, action, resource, result, UTC timestamp, request ID, sanitized metadata. Passwords, tokens and secrets are stripped from metadata. Export is capability-gated and itself audited.

## Monitoring
`/api/health` (liveness, minimal), `/api/ready` (DB ping; 503 when down), `/api/admin/monitoring` (restricted): DB latency, email last-attempt status (recorded per send), uptime, request counts/latency, 5xx ring buffer, data counts. States: healthy / degraded / down / unknown / not_configured. Metrics are in-memory and reset on restart; no fabricated values are shown.

## Backup & recovery
`mongodump --db <DB_NAME> --out backup-$(date +%F)` covers content, users, submissions and audit logs; restore with `mongorestore`. In the preview environment MongoDB data does not survive pod restarts — treat preview data as disposable and take dumps before planned restarts.

## External configuration still required
- Production `CORS_ORIGINS` (https://autraxis.com,https://www.autraxis.com) and `FRONTEND_URL` (used in reset links).
- `EMERGENT_EMAIL_KEY` present in the deployed environment (platform-provisioned).
- Rotate `JWT_SECRET` and the admin password before go-live; change the password in /admin/security.
- TOTP MFA, persistent metrics/alerting (e.g. uptime monitor on /api/health), and a dedicated admin subdomain are documented options, not implemented.
