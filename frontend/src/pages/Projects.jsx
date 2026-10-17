import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import PageHero from "@/components/PageHero";
import { Reveal, Eyebrow } from "@/components/Reveal";
import { projects } from "@/data/content";
import usePageMeta from "@/hooks/usePageMeta";

const Projects = () => {
  usePageMeta("Projects & Demonstrations", "Architecture demonstrations and sandbox integration blueprints from AUTRAXIS — published to show how we think, not client engagements.");

  return (
    <div data-testid="projects-page">
      <PageHero
        testId="projects-hero"
        eyebrow="Projects & Demonstrations"
        title="Blueprints that show how we think"
        description="Everything on this page is a demonstration — reference architectures and sandbox builds we publish to make our engineering approach concrete. They are not client engagements, and no customer data appears anywhere in them."
      />

      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-8">
          {projects.map((p) => (
            <Reveal key={p.id} delay={0.05}>
              <article
                data-testid={`project-card-${p.id}`}
                className="rounded-3xl border border-hairline bg-[#FAFAFA] p-8 lg:p-12 grid lg:grid-cols-2 gap-10 transition-all duration-300 hover:border-cyan-500/40"
              >
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                    {p.title}
                  </h2>
                  <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-600">{p.description}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {p.tech.map((t) => (
                      <span key={t} className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-900 text-cyan-300">
                        {t}
                      </span>
                    ))}
                  </div>
                  <Link
                    to={`/projects/${p.id}`}
                    data-testid={`project-walkthrough-${p.id}`}
                    className="group mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white text-sm font-semibold transition-colors hover:bg-electric"
                  >
                    Open the walkthrough <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
                <div className="rounded-2xl bg-slate-900 p-7">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyanglow mb-5">Design highlights</p>
                  <ul className="space-y-4">
                    {p.highlights.map((h) => (
                      <li key={h} className="flex gap-3 text-sm leading-relaxed text-slate-300">
                        <CheckCircle2 size={17} className="text-cyanglow shrink-0 mt-0.5" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>
          ))}

          <Reveal>
            <div className="rounded-3xl bg-abyss relative overflow-hidden p-8 lg:p-14 text-center">
              <div className="absolute inset-0 bg-grid-dark opacity-50" aria-hidden="true" />
              <div className="relative">
                <Eyebrow dark>Want the walkthrough?</Eyebrow>
                <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-frost max-w-2xl mx-auto">
                  We'll happily walk through any blueprint live, against your own landscape.
                </h2>
                <Link
                  to="/contact"
                  data-testid="projects-cta"
                  className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-electric text-white font-semibold transition-all duration-200 hover:bg-cyanglow hover:text-abyss"
                >
                  Request a walkthrough <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default Projects;
