import PageHero from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import usePageMeta from "@/hooks/usePageMeta";

const SECTIONS = [
  {
    h: "1. About this site",
    p: "This website is operated by AUTRAXIS to describe our enterprise integration and AI technology services. By using this site you accept these terms. If you do not agree, please do not use the site.",
  },
  {
    h: "2. No professional advice or warranties",
    p: "Content on this site — including articles, reference architectures and demonstrations — is provided for general information. Projects and demonstrations are illustrative and do not describe specific client engagements. Nothing here constitutes a binding offer, a service-level commitment, or professional advice for your specific environment.",
  },
  {
    h: "3. Intellectual property",
    p: "The AUTRAXIS name, logo mark, and the content and diagrams published on this site are the property of AUTRAXIS unless stated otherwise. You may not reproduce them commercially without written permission.",
  },
  {
    h: "4. Acceptable use",
    p: "Do not misuse this site: no attempts to probe or disrupt the service, no automated scraping of forms, and no submission of unlawful, misleading or third-party-confidential material through our forms.",
  },
  {
    h: "5. Third-party platforms",
    p: "References to third-party platforms (for example Dell Boomi or SAP) describe technologies we work with. AUTRAXIS is an independent practice and this site does not imply endorsement or partnership with those vendors unless explicitly agreed in writing.",
  },
  {
    h: "6. Limitation of liability",
    p: "To the maximum extent permitted by law, AUTRAXIS is not liable for indirect or consequential losses arising from use of this site or reliance on its content.",
  },
  {
    h: "7. Contact",
    p: "Questions about these terms: info@autraxis.com.",
  },
];

const Terms = () => {
  usePageMeta("Terms of Use", "Terms governing use of the AUTRAXIS website.");

  return (
    <div data-testid="terms-page">
      <PageHero
        testId="terms-hero"
        eyebrow="Legal"
        title="Terms of Use"
        description="Plain-language terms for using this website. Last updated: July 2026."
      />
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <Reveal>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800" data-testid="terms-review-notice">
              These terms are a working foundation, not legal advice. They should be reviewed by qualified counsel
              in your operating jurisdictions before the site goes live.
            </div>
          </Reveal>
          <div className="mt-10 space-y-10">
            {SECTIONS.map((s) => (
              <Reveal key={s.h}>
                <section>
                  <h2 className="font-display text-xl font-semibold text-slate-900">{s.h}</h2>
                  <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600">{s.p}</p>
                </section>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Terms;
