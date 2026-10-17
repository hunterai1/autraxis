import { Link } from "react-router-dom";
import { ArrowRight, ArrowDown } from "lucide-react";
import PageHero from "@/components/PageHero";
import { Reveal, Eyebrow } from "@/components/Reveal";
import { solutions } from "@/data/content";
import usePageMeta from "@/hooks/usePageMeta";

const Solutions = () => {
  usePageMeta("Solutions & Use Cases", "Representative integration architectures for manufacturing, retail & distribution, healthcare and financial services.");

  return (
    <div data-testid="solutions-page">
      <PageHero
        testId="solutions-hero"
        eyebrow="Solutions & Use Cases"
        title="Representative architectures, explained in business terms"
        description="These are reference architectures — honest illustrations of how we approach common industry problems, not claims about specific client engagements."
      />

      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-10">
          {solutions.map((s, i) => (
            <Reveal key={s.id} delay={0.05}>
              <article
                data-testid={`solution-block-${s.id}`}
                className={`rounded-3xl border p-8 lg:p-12 grid lg:grid-cols-5 gap-10 ${
                  i % 2 === 0 ? "border-hairline bg-[#FAFAFA]" : "border-cyan-500/20 bg-slate-900"
                }`}
              >
                <div className="lg:col-span-2">
                  <p className={`font-mono text-[10px] uppercase tracking-[0.25em] ${i % 2 === 0 ? "text-electric" : "text-cyanglow"}`}>
                    {s.industry}
                  </p>
                  <h2 className={`mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight ${i % 2 === 0 ? "text-slate-900" : "text-frost"}`}>
                    {s.title}
                  </h2>
                  <p className={`mt-4 text-sm sm:text-base leading-relaxed ${i % 2 === 0 ? "text-slate-600" : "text-mist"}`}>
                    {s.summary}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {s.stack.map((t) => (
                      <span
                        key={t}
                        className={`font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          i % 2 === 0 ? "bg-slate-900 text-cyan-300" : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/25"
                        }`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-3">
                  <p className={`font-mono text-[10px] uppercase tracking-[0.25em] mb-5 ${i % 2 === 0 ? "text-slate-500" : "text-slate-400"}`}>
                    Reference flow
                  </p>
                  <div className="flex flex-col gap-3">
                    {s.flow.map((step, j) => (
                      <div key={step}>
                        <div
                          className={`flex items-center gap-4 rounded-xl px-5 py-3.5 text-sm font-medium ${
                            i % 2 === 0
                              ? "bg-white border border-hairline text-slate-800"
                              : "bg-panel/70 border border-cyan-500/20 text-slate-200"
                          }`}
                          data-testid={`solution-flow-${s.id}-${j}`}
                        >
                          <span className={`font-mono text-xs ${i % 2 === 0 ? "text-electric" : "text-cyanglow"}`}>
                            {String(j + 1).padStart(2, "0")}
                          </span>
                          {step}
                        </div>
                        {j < s.flow.length - 1 && (
                          <ArrowDown size={14} className={`ml-7 my-1 ${i % 2 === 0 ? "text-slate-300" : "text-slate-600"}`} aria-hidden="true" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}

          <Reveal>
            <div className="rounded-3xl bg-abyss relative overflow-hidden p-8 lg:p-14 text-center">
              <div className="absolute inset-0 bg-grid-dark opacity-50" aria-hidden="true" />
              <div className="relative">
                <Eyebrow dark>Your industry not listed?</Eyebrow>
                <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-frost max-w-2xl mx-auto">
                  Integration problems rhyme across industries. Tell us yours.
                </h2>
                <Link
                  to="/contact"
                  data-testid="solutions-cta"
                  className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-electric text-white font-semibold transition-all duration-200 hover:bg-cyanglow hover:text-abyss"
                >
                  Describe your landscape <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default Solutions;
