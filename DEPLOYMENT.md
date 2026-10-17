# AUTRAXIS — Deployment & Operations Guide

## What this is
React (CRA + craco) frontend, FastAPI backend, MongoDB database. All backend routes are prefixed `/api`. Frontend calls the backend via `REACT_APP_BACKEND_URL`.

## Environment variables
See `backend/.env.example`. Required:
- `MONGO_URL`, `DB_NAME` — MongoDB connection
- `CORS_ORIGINS` — set to `https://autraxis.com,https://www.autraxis.com` in production
- `EMERGENT_EMAIL_KEY` — platform-managed transactional email key (do not expose to frontend)
- `EMAIL_FROM_NAME=AUTRAXIS` — sender display name (the From address itself is platform-managed)
- `EMAIL_REPLY_TO`, `CONTACT_INBOX=info@autraxis.com`, `CAREERS_INBOX=careers@autraxis.com`
Frontend: `REACT_APP_BACKEND_URL` only.

## Zoho Mail
No Zoho Mail configuration existed in this codebase, and this project does not touch it. Form notification emails are sent through the platform's transactional email service and delivered to the Zoho-hosted inboxes `info@autraxis.com` / `careers@autraxis.com` like any external email. No DNS or MX changes are needed or have been made.

## Deploying to autraxis.com (cost-conscious)
1. Deploy this app with Emergent's one-click deploy and attach `autraxis.com` + `www.autraxis.com` as custom domains (DNS changes are done by the domain owner at the registrar — point A/CNAME records per the hosting instructions; none have been made here).
2. Update `CORS_ORIGINS` in the backend env to the production domains and restart the backend.
3. `public/sitemap.xml` and `public/robots.txt` already reference `https://autraxis.com`.
4. Cost notes: a single small instance comfortably serves this site (static frontend + lightweight API). MongoDB can run on the same host or a free/low tier managed cluster. Transactional email is pay-per-send and this site sends only on form submission — negligible volume.

## Backend setup still required / known limitations
- The per-app email key must be present in the deployed environment (platform-provisioned in Emergent).
- Form spam protection is a honeypot + per-IP rate limit (6 submissions / 10 min). Add CAPTCHA if abuse appears.
- Submissions live in MongoDB collections `contact_submissions` and `career_applications`. There is no admin UI yet — query the DB or export as needed.
- No analytics are installed. If you add any (e.g., a privacy-friendly option like Plausible), update the Privacy Policy accordingly.

## Legal / configuration items to resolve before launch
- Have counsel review `/privacy` and `/terms` (both pages carry an on-page notice).
- Confirm careers inbox (`careers@autraxis.com`) is monitored.
- Review role listings and confirm they reflect actual open positions.
- No company registration details, physical address or certifications are stated anywhere on the site — add real ones only when verified.
