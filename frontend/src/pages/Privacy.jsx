import PageHero from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import usePageMeta from "@/hooks/usePageMeta";

const SECTIONS = [
  {
    h: "1. Who we are",
    p: "AUTRAXIS is a remote-first enterprise integration and AI technology practice. This policy explains what personal data we collect through this website, why, and how it is handled. Contact for privacy questions: info@autraxis.com.",
  },
  {
    h: "2. What we collect",
    p: "When you submit the contact or careers form, we collect the details you provide: name, email address, company (optional), the topic or role selected, and your message. We do not run advertising trackers on this site and we do not sell personal data to anyone.",
  },
  {
    h: "3. Why we collect it",
    p: "We use the information you submit for one purpose: to respond to your inquiry or application. Contact form submissions are stored in our secured database and emailed to info@autraxis.com; career applications to careers@autraxis.com.",
  },
  {
    h: "4. Retention",
    p: "We retain inquiry and application records for as long as needed to handle your request and any follow-up conversation, after which they are deleted or anonymised. You may ask us to delete your data at any time (see section 6).",
  },
  {
    h: "5. Security",
    p: "Form submissions are transmitted over HTTPS, validated and rate-limited server-side, and stored with access restricted to the team members who handle inquiries. Email delivery is handled by our transactional email provider.",
  },
  {
    h: "6. Your rights",
    p: "Depending on your jurisdiction (including GDPR/UK GDPR where applicable), you may have the right to access, correct, export or erase your personal data, and to object to or restrict processing. Email info@autraxis.com to exercise any of these rights and we will respond promptly.",
  },
  {
    h: "7. Changes",
    p: "If this policy changes materially, the updated version will be published on this page with a revised date.",
  },
];

const Privacy = () => {
  usePageMeta("Privacy Policy", "How AUTRAXIS collects, uses and protects personal data submitted through this website.");

  return (
    <div data-testid="privacy-page">
      <PageHero
        testId="privacy-hero"
        eyebrow="Legal"
        title="Privacy Policy"
        description="The short version: we collect only what you type into our forms, use it only to reply to you, and delete it when you ask. Last updated: July 2026."
      />
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <Reveal>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800" data-testid="legal-review-notice">
              This policy is a working foundation, not legal advice. It should be reviewed by qualified counsel
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

export default Privacy;
