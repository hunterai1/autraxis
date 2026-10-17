import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, FlaskConical, CheckCircle2 } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/Reveal";
import FlowDiagram from "@/components/FlowDiagram";
import { projects } from "@/data/content";
import { projectWalkthroughs } from "@/data/walkthroughs";
import usePageMeta from "@/hooks/usePageMeta";
import NotFound from "@/pages/NotFound";

const ProjectDetail = () => {
  const { slug } = useParams();
  const project = projects.find((p) => p.id === slug);
  const walk = projectWalkthroughs[slug];
  usePageMeta(project ? project.title : "Project", project?.description);

  if (!project || !walk) return <NotFound />;

  return (
    <div data-testid={`project-detail-${slug}`}>
      <section className="relative bg-abyss pt-[72px] overflow-hidden">
        <div className="absolute inset-0 bg-grid-dark opacity-60" aria-hidden="true" />
        <div className="absolute -top-32 right-0 w-[560px] h-[360px] rounded-full bg-electric/20 blur-[140px]" aria-hidden="true" />
        <div className="relative max-w-5xl mx-auto px-5 sm:px-8 py-16 lg:py-24">
          <Reveal>
            <Link to="/projects" data-testid="back-to-projects-link" className="inline-flex items-center gap-2 text-sm text-mist hover:text-cyan-300 transition-colors mb-8">
              <ArrowLeft size={15} /> All blueprints
            </Link>
            <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <FlaskConical size={12} /> Demonstration blueprint — not a client engagement
            </span>
            <h1 className="mt-6 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-frost max-w-3xl">
              {project.title}
            </h1>
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-mist max-w-3xl">{project.description}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {project.tech.map((t) => (
                <span key={t} className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-panel border border-cyan-500/25 text-cyan-300">
                  {t}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-abyss pb-20 lg:pb-28 border-t border-cyan-500/10">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <Reveal>
            <Eyebrow dark>The flow</Eyebrow>
            <FlowDiagram nodes={walk.nodes} edges={walk.edges} testId={`walkthrough-diagram-${slug}`} />
          </Reveal>

          <div className="mt-8 grid md:grid-cols-2 gap-5">
            {walk.payloads.map((p) => (
              <Reveal key={p.title}>
                <div className="rounded-2xl border border-cyan-500/20 bg-abyss/80 p-6 overflow-x-auto h-full" data-testid={`payload-${slug}-${p.title.slice(0, 12).replace(/\W+/g, "-").toLowerCase()}`}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-3">{p.title}</p>
                  <pre className="font-mono text-xs leading-relaxed text-skybright whitespace-pre">{p.code}</pre>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <Reveal>
            <Eyebrow>Walkthrough</Eyebrow>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Why it's built this way
            </h2>
          </Reveal>
          <div className="mt-10 space-y-12">
            {walk.walkthrough.map((s, i) => (
              <Reveal key={s.heading} delay={i * 0.05}>
                <section data-testid={`walkthrough-section-${i}`}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-electric mb-2">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="font-display text-2xl font-semibold tracking-tight text-slate-900">{s.heading}</h3>
                  <p className="mt-3 text-base leading-relaxed text-slate-600">{s.text}</p>
                </section>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="mt-14 rounded-2xl border border-hairline bg-[#FAFAFA] p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-5">Design highlights</p>
              <ul className="space-y-3.5">
                {project.highlights.map((h) => (
                  <li key={h} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                    <CheckCircle2 size={17} className="text-cyanglow shrink-0 mt-0.5" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal>
            <div className="mt-14 rounded-2xl bg-abyss relative overflow-hidden p-8 lg:p-10 text-center" data-testid="project-detail-cta">
              <div className="absolute inset-0 bg-grid-dark opacity-50" aria-hidden="true" />
              <div className="relative">
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-frost">
                  Want this pattern on your landscape?
                </h3>
                <p className="mt-2 text-sm text-mist">We'll map the blueprint onto your actual systems in a working session.</p>
                <Link
                  to="/contact"
                  data-testid="project-contact-cta"
                  className="mt-6 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-electric text-white text-sm font-semibold transition-all duration-200 hover:bg-cyanglow hover:text-abyss"
                >
                  Book a walkthrough <ArrowUpRight size={15} />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default ProjectDetail;
