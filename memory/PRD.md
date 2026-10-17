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

## Prioritized backlog
- P0: Legal counsel review of Privacy/Terms (flagged on-page). Deploy + DNS for autraxis.com (owner action at registrar). Confirm careers inbox monitoring; confirm role listings are real.
- P1: Admin view or export for form submissions (currently DB-only). CAPTCHA if spam appears. OG share image asset.
- P2: Analytics (privacy-friendly) + privacy policy update. More insights articles. Case-study section when real, permissioned client work exists.

## Next tasks
1. Deploy via Emergent, attach autraxis.com, set production CORS_ORIGINS.
2. Legal review of legal pages.
3. Build a lightweight submissions inbox view (P1) if desired.
