import { Link } from "react-router-dom";
import { ArrowRight, Compass, FileText, ShieldCheck, Users } from "lucide-react";
import PageHero from "@/components/PageHero";
import { Reveal, Eyebrow } from "@/components/Reveal";
import usePageMeta from "@/hooks/usePageMeta";

const PRINCIPLES = [
  { icon: Compass, title: "Architecture before tools", text: "Platform choices follow from constraints — volume, latency, team skills, budget. Never the other way around." },
  { icon: FileText, title: "Documentation is a deliverable", text: "Every engagement ends with artefacts your team can operate from: decision records, runbooks, interface catalogues." },
  { icon: ShieldCheck, title: "Security by default", text: "Encryption, least-privilege access and secrets hygiene are designed in from the first diagram, not audited in later." },
  { icon: Users, title: "Handover beats lock-in", text: "We succeed when your team no longer needs us. Knowledge transfer is scheduled work, not a hopeful afterthought." },
];

const About = () => {
  usePageMeta("About", "AUTRAXIS is a remote-first enterprise integration and AI technology practice. Our philosophy, operating model and the standards we work to.");

  return (
    <div data-testid="about-page">
      <PageHero
        testId="about-hero"
        eyebrow="About AUTRAXIS"
        title="A remote-first practice for the connective tissue of enterprise IT"
        description="AUTRAXIS exists for a simple reason: the space between enterprise systems is where value leaks. We close those gaps with disciplined integration engineering and pragmatic AI — and we explain everything in language the whole business can read."
      />

      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <Reveal>
              <Eyebrow>Operating model</Eyebrow>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Remote-first by design, not by circumstance
              </h2>
              <div className="mt-6 space-y-4 text-sm sm:text-base leading-relaxed text-slate-600">
                <p>
                  We work asynchronously across time zones, with writing as the default medium. That isn't a
                  compromise — it's why our documentation is unusually good, our meetings are unusually rare,
                  and our clients get senior engineers instead of whoever was geographically available.
                </p>
                <p>
                  Engagements are scoped in writing, delivered iteratively, and reviewed against the scope —
                  not against elapsed hours. You'll always know what shipped, what's next, and what changed.
                </p>
                <p>
                  We're deliberately selective about claims: you'll find no invented client logos, fabricated
                  metrics or borrowed testimonials on this site. Our work speaks through the architectures,
                  demonstrations and articles we publish.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="relative">
                <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-cyanglow/30 to-electric/20 blur-xl" aria-hidden="true" />
                <img
                  src="https://images.unsplash.com/photo-1580894894513-541e068a3e2b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNTl8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBzb2Z0d2FyZSUyMGVuZ2luZWVyJTIwbGFwdG9wJTIwb2ZmaWNlJTIwd29ya3NwYWNlfGVufDB8fHx8MTc5MjIzODc3MHww&ixlib=rb-4.1.0&q=85"
                  alt="An engineer working remotely at a focused, minimal workspace"
                  className="relative rounded-3xl border border-hairline w-full h-[380px] object-cover"
                  loading="lazy"
                  data-testid="about-workspace-image"
                />
              </div>
            </Reveal>
          </div>

          <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.06}>
                <div className="h-full rounded-2xl border border-hairline bg-[#FAFAFA] p-7" data-testid={`principle-card-${i}`}>
                  <p.icon size={22} className="text-electric" />
                  <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-abyss py-20 lg:py-28 border-t border-cyan-500/15">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-14 items-center">
          <Reveal>
            <Eyebrow dark>The stack we reach for</Eyebrow>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-frost">
              Proven platforms, current patterns
            </h2>
            <p className="mt-5 text-base leading-relaxed text-mist">
              We're platform-honest: we recommend what fits your constraints, including when the right
              answer is "keep what you have." These are the technologies we know deeply enough to stake
              a design on.
            </p>
            <Link
              to="/contact"
              data-testid="about-cta"
              className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-electric text-white font-semibold transition-all duration-200 hover:bg-cyanglow hover:text-abyss"
            >
              Talk to us about your estate <ArrowRight size={16} />
            </Link>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="flex flex-wrap gap-2.5" data-testid="about-stack-chips">
              {[
                "Dell Boomi AtomSphere", "SAP S/4HANA", "SAP BTP Integration Suite", "X12 / EDIFACT",
                "AS2 / SFTP", "OpenAPI", "OAuth 2.0 / OIDC", "AWS", "Microsoft Azure",
                "Event streaming", "Kubernetes", "Terraform", "Python", "TypeScript", "LLM pipelines",
              ].map((t) => (
                <span key={t} className="font-mono text-xs px-3.5 py-2 rounded-full bg-panel border border-cyan-500/20 text-cyan-300">
                  {t}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default About;
