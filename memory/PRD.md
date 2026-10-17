# AUTRAXIS — Product Requirements Document

## Original problem statement
Build a premium, responsive, multi-page website for AUTRAXIS, a remote-first enterprise integration and AI technology business (tagline: "Intelligence. Integrated."), with a hybrid visual direction (cinematic deep-navy hero, electric-blue/cyan technical graphics, clean white editorial sections, custom integration architecture diagrams, refined motion, accessible navigation, responsive layouts). Pages: Home, Services + details, Solutions & Use Cases, About, Projects & Demonstrations (labeled illustrative), Insights, Contact, Careers, Legal/Privacy. Business-friendly language; no fabricated customers, certifications, testimonials or metrics. Contact email info@autraxis.com, careers@autraxis.com; secure contact form handling; preserve Zoho Mail config; document remaining backend setup. SEO metadata, sitemap, robots.txt, accessibility/performance/security fundamentals, environment example, cost-conscious deployment guidance for autraxis.com. No DNS changes, no spending, no unverified claims.

## User personas
- Enterprise IT leader / architect evaluating integration partners
- Operations manager with EDI/SAP pain, non-specialist reader
- Prospective engineer evaluating remote-first roles

## Architecture
- React (CRA/craco) frontend, react-router multi-page, Tailwind + custom brand tokens (abyss/panel/cyanglow), framer-motion reveals, Lenis smooth scroll, custom SVG logo mark + favicon, interactive SVG node-graph diagram (SMIL payload animation + click-to-inspect).
- FastAPI backend (`/api` prefix): POST /api/contact, POST /api/careers, GET /api/health. MongoDB storage, honeypot + per-IP rate limit, security headers middleware.
- Email: Emergent-managed Resend proxy (server-side templates, guardrail gate, recipients fixed server-side to info@/careers@autraxis.com). Zoho Mail untouched — no DNS/MX changes.

## Core requirements (static)
All pages listed above; honest copy with no fabricated proof points; only the two official emails; SEO + sitemap + robots; accessibility (skip link, focus styles, ARIA); deployment + legal documentation.

## Implemented (2026-10-17)
- Full multi-page site: Home (masked kinetic hero, interactive architecture diagram, marquee, services grid, process, insights, CTA), Services index + 6 detail pages, Solutions (4 representative architectures), About, Projects (3 demos labeled illustrative), Insights (3 full articles + detail pages), Contact (working form), Careers (3 roles + working application form), Privacy + Terms (foundations with review notices), 404.
- Backend: contact + careers endpoints storing to MongoDB and emailing info@autraxis.com / careers@autraxis.com via managed Resend (verified notified:true on both).
- SEO metadata, sitemap.xml, robots.txt, favicon.svg, .env.example, DEPLOYMENT.md (cost-conscious guidance, Zoho notes, unresolved legal/config items).
- Verified: API curls (health, contact, careers all 200, notified true); screenshots at 375/768/1366; contact form e2e flow through UI; service detail and article pages.

## Implemented (2026-10-17, iteration 3 — Control Center)
- Full admin platform under /admin/*: dark-sidebar Control Center (dashboard, inquiries, applications, content, monitoring, audit logs, users & roles, site settings, security) with noindex and robots.txt exclusion; admin link removed from public footer.
- RBAC with 5 roles and server-side capability enforcement (`require_cap`), denied-attempt audit logging; noindex header on admin APIs.
- Auth hardening: 12h JWT with per-user token_version (invalidation on password change/suspend/revoke), generic login errors, IP+email lockout, single-use hashed reset tokens (forgot/reset flows + invite-by-setup-link), re-auth for sensitive user actions, last-super-admin safeguards.
- CMS: MongoDB is now the content source of truth — singletons (home/about/settings) with draft→publish and revision restore; collections (services, solutions, projects, insights, jobs) with status lifecycle; public site consumes /api/content/bundle with build-time fallbacks; social links managed in Settings (enable/order/validate).
- Jobs module: full lifecycle (draft/published/closed/archived), careers page renders published jobs, applications get status + internal notes.
- Audit log: append-only, sanitized metadata, filtered view + gated export.
- Monitoring: real liveness/readiness endpoints, DB ping, email last-send status, in-memory traffic/error metrics — no fabricated values.
- Verified: 19/19 automated security checks (tests/security_check.py), full RBAC curl matrix, content publish roundtrip visible on public site, jobs draft→publish→delete lifecycle, production build (CI=true) passes, admin UI screenshotted (dashboard, content, users, jobs, settings, monitoring, audit).
- Incident during build: admin router wrote jobs to cms_jobs while bundle read jobs — fixed by unifying collection mapping; verified end to end. Note: preview MongoDB data does not survive pod restarts (documented).
- Not implemented (documented): TOTP MFA, persistent external monitoring/alerts, admin subdomain.

## Implemented (2026-10-17, iteration 2)
- Replaced the placeholder logo with the user-supplied brand: the ORIGINAL supplied artwork is used verbatim — transparent-background derivatives of the uploaded icon.png (header/footer/admin/favicon/OG card) and logo-full.webp lockup on a white card in the footer; wordmark subline "SYSTEMS INC."; footer copyright "AUTRAXIS Systems Inc." Originals preserved untouched in public/brand/.
- Admin submissions inbox: JWT auth (seeded admin, brute-force lockout), /admin sign-in, /admin/inbox with Inquiries/Applications tabs, expand-to-read, read/unread toggles, sign out. Tested: login, me, submissions list, read toggle, 401s for unauthenticated/wrong-password.
- Privacy-friendly analytics: cookieless/IP-less pageview counter (POST /api/analytics/pageview), admin Analytics tab with 30-day totals, 14-day bars, top pages. Privacy policy updated to disclose it.
- Blueprint walkthrough pages: /projects/:slug for all three demonstrations — custom flow diagram, sample payloads, three-part walkthrough narrative, highlights, CTA. Each clearly labeled "Demonstration blueprint — not a client engagement".
- Share card: generated public/og-image.png (1200×630, navy + grid + mark + tagline), og:image + twitter summary_large_image tags in index.html.
- Copy de-duplication: removed repeated "illustrative" wording (kept single, meaningful disclaimers per context); fixed diagram label overlap in walkthrough diagrams; added project detail URLs to sitemap.
- Verification: curl chain for all new endpoints (login → me → submissions → analytics, 401 negatives); browser-tested admin sign-in → inbox → expand → analytics tab; walkthrough page screenshot; OG image visually inspected; mobile 375px re-checked.

## Prioritized backlog
- P0: Legal counsel review of Privacy/Terms. Deploy + DNS for autraxis.com (owner action). Confirm careers inbox monitoring; confirm role listings are real. Change admin password on first use via env update.
- P1: Delete/export submissions from admin UI. CAPTCHA if spam appears. Change-password flow for admin (currently env-managed).
- P2: More insights articles and blueprints. Case-study section when real, permissioned client work exists.

## Next tasks
1. Deploy via Emergent, attach autraxis.com, set production CORS_ORIGINS.
2. Legal review of legal pages.
3. Build a lightweight submissions inbox view (P1) if desired.
