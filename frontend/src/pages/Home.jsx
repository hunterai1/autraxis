import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, CheckCircle2, Terminal } from "lucide-react";
import { MaskedLines, Reveal, Eyebrow } from "@/components/Reveal";
import Marquee from "@/components/Marquee";
import NetworkDiagram from "@/components/NetworkDiagram";
import { services, solutions, insights } from "@/data/content";
import usePageMeta from "@/hooks/usePageMeta";

const Home = () => {
  usePageMeta(null, "AUTRAXIS is a remote-first enterprise integration and AI technology practice: Dell Boomi iPaaS, SAP connectivity, B2B EDI, API engineering, cloud integration and intelligent automation.");

  return (
    <div data-testid="home-page">
      {/* ---------- Cinematic hero ---------- */}
      <section className="relative bg-abyss pt-[72px] overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0 bg-grid-dark opacity-60" aria-hidden="true" />
        <div className="absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full bg-electric/25 blur-[160px]" aria-hidden="true" />
        <div className="absolute top-1/3 -right-40 w-[480px] h-[480px] rounded-full bg-cyanglow/15 blur-[160px]" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 lg:pt-28 pb-14">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-mono text-xs uppercase tracking-[0.35em] text-cyanglow mb-6"
            data-testid="hero-eyebrow"
          >
            Enterprise Integration &amp; AI Technology
          </motion.p>

          <MaskedLines
            lines={["Intelligence.", "Integrated."]}
            className="font-display text-5xl sm:text-6xl lg:text-8xl font-extrabold tracking-tight leading-[1.02] text-frost"
            lineClassName="last:text-gradient-cyan"
          />

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-7 max-w-2xl text-base sm:text-lg leading-relaxed text-mist"
            data-testid="hero-subtitle"
          >
            AUTRAXIS connects the systems your business already runs on — ERP, partners, cloud, data —
            and makes the space between them intelligent. Remote-first. Engineering-grade. Explained in plain language.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.75 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/services"
              data-testid="hero-explore-services-cta"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-electric text-white font-semibold transition-all duration-200 hover:bg-cyanglow hover:text-abyss hover:shadow-[0_0_32px_rgba(6,182,212,0.5)]"
            >
              Explore capabilities <ArrowRight size={17} />
            </Link>
            <Link
              to="/contact"
              data-testid="hero-contact-cta"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-cyan-500/40 text-cyan-300 font-semibold transition-colors duration-200 hover:bg-cyan-500/10 hover:border-cyan-400"
            >
              Talk to an engineer <ArrowUpRight size={17} />
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-6xl mx-auto px-5 sm:px-8 pb-20"
        >
          <NetworkDiagram interactive />
          <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">
            Illustrative architecture — select a node to inspect its payload
          </p>
        </motion.div>
      </section>

      <Marquee />

      {/* ---------- Services — white editorial ---------- */}
      <section className="bg-white py-20 lg:py-32" data-testid="services-preview-section">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal>
            <Eyebrow>What we do</Eyebrow>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 max-w-xl">
                Six disciplines. One integrated estate.
              </h2>
              <p className="text-base leading-relaxed text-slate-600 max-w-md">
                From Boomi processes to AI-assisted operations — every capability below is delivered
                with the same discipline: documented, tested, and built to be handed over.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <Reveal key={s.slug} delay={i * 0.06}>
                <Link
                  to={`/services/${s.slug}`}
                  data-testid={`service-card-${s.slug}`}
                  className="group flex flex-col h-full rounded-2xl border border-hairline bg-white p-7 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_12px_48px_rgba(37,99,235,0.12)] hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-6 transition-colors duration-300 group-hover:bg-electric">
                    <s.icon size={22} className="text-cyanglow" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-slate-900">{s.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 flex-1">{s.short}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-electric transition-colors group-hover:text-cyanglow">
                    View capability <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- How we work — dark tech ---------- */}
      <section className="relative bg-abyss py-20 lg:py-32 overflow-hidden" data-testid="how-we-work-section">
        <div className="absolute inset-0 bg-grid-dark opacity-50" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-start">
            <Reveal>
              <Eyebrow dark>How we work</Eyebrow>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-frost">
                Integration is engineering. We treat it that way.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-mist">
                No black boxes, no hero consultants, no undocumented magic. Every engagement follows the
                same arc — and every artefact we produce belongs to you.
              </p>
              <ol className="mt-10 space-y-8">
                {[
                  ["01", "Discover", "Systems, documents, teams and constraints mapped before any design begins."],
                  ["02", "Design", "Flows and failure behaviour drawn up and reviewed with your stakeholders in plain language."],
                  ["03", "Build", "Iterative delivery with working demos early — surprises surface in week one, not week twelve."],
                  ["04", "Operate", "Monitoring, runbooks and handover so your team owns the estate, not us."],
                ].map(([num, title, text]) => (
                  <li key={num} className="flex gap-5" data-testid={`process-step-${num}`}>
                    <span className="font-mono text-cyanglow text-sm pt-1 shrink-0">{num}</span>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-frost">{title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-mist">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="rounded-2xl border border-cyan-500/20 bg-panel/70 backdrop-blur-sm p-6 lg:sticky lg:top-28" data-testid="principles-terminal">
                <div className="flex items-center gap-2 pb-4 border-b border-cyan-500/15">
                  <Terminal size={15} className="text-cyanglow" />
                  <span className="font-mono text-xs text-slate-400">delivery-principles.yaml</span>
                </div>
                <pre className="mt-4 font-mono text-xs sm:text-sm leading-loose text-slate-300 overflow-x-auto">{`principles:
  architecture_first: true
  boring_where_possible: true
  documentation: "a deliverable, not a favor"
  handover: "your team owns it"
ai_policy:
  hype: false
  measure_before_trust: true
  humans_in_the_loop: always
communication:
  language: "business-friendly"
  surprises: "week one, not week twelve"`}</pre>
                <div className="mt-5 flex items-center gap-2 text-xs text-emerald-400 font-mono">
                  <CheckCircle2 size={14} /> validated · 0 hype detected
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Solutions preview — light editorial ---------- */}
      <section className="bg-[#FAFAFA] py-20 lg:py-32" data-testid="solutions-preview-section">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal>
            <Eyebrow>Solutions &amp; use cases</Eyebrow>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 max-w-2xl">
              Architectures for the industries that move physical things
            </h2>
          </Reveal>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6">
            {solutions.map((s, i) => (
              <Reveal key={s.id} delay={i * 0.06}>
                <div className="h-full rounded-2xl border border-hairline bg-white p-8 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_12px_48px_rgba(37,99,235,0.1)]" data-testid={`solution-card-${s.id}`}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-electric">{s.industry}</p>
                  <h3 className="mt-3 font-display text-xl font-semibold text-slate-900">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{s.summary}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2}>
            <Link
              to="/solutions"
              data-testid="solutions-view-all-link"
              className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-electric hover:text-cyanglow transition-colors"
            >
              Explore all solution architectures <ArrowRight size={15} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------- Insights preview ---------- */}
      <section className="bg-white py-20 lg:py-32 border-t border-hairline" data-testid="insights-preview-section">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal>
            <Eyebrow>Insights</Eyebrow>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 max-w-xl">
                Field notes from the integration layer
              </h2>
              <Link to="/insights" data-testid="insights-view-all-link" className="inline-flex items-center gap-2 text-sm font-semibold text-electric hover:text-cyanglow transition-colors shrink-0">
                All articles <ArrowRight size={15} />
              </Link>
            </div>
          </Reveal>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            {insights.map((a, i) => (
              <Reveal key={a.slug} delay={i * 0.06}>
                <Link
                  to={`/insights/${a.slug}`}
                  data-testid={`insight-card-${a.slug}`}
                  className="group flex flex-col h-full rounded-2xl border border-hairline bg-white p-7 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_12px_48px_rgba(37,99,235,0.1)] hover:-translate-y-1"
                >
                  <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    <span className="text-electric">{a.tag}</span>
                    <span aria-hidden="true">·</span>
                    <span>{a.minutes} min read</span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold leading-snug text-slate-900 group-hover:text-electric transition-colors">
                    {a.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 flex-1">{a.excerpt}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-electric group-hover:text-cyanglow transition-colors">
                    Read article <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="relative bg-abyss py-20 lg:py-28 overflow-hidden" data-testid="home-cta-section">
        <div className="absolute inset-0 bg-grid-dark opacity-50" aria-hidden="true" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[320px] rounded-full bg-electric/20 blur-[140px]" aria-hidden="true" />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-8 text-center">
          <Reveal>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-frost">
              Have systems that need to talk?
            </h2>
            <p className="mt-5 text-base sm:text-lg text-mist max-w-xl mx-auto">
              Tell us what's connected, what isn't, and what keeps breaking. An engineer — not a sales deck — will reply.
            </p>
            <Link
              to="/contact"
              data-testid="home-bottom-cta"
              className="mt-9 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-electric text-white font-semibold transition-all duration-200 hover:bg-cyanglow hover:text-abyss hover:shadow-[0_0_36px_rgba(6,182,212,0.5)]"
            >
              Start a conversation <ArrowUpRight size={17} />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default Home;
