import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import { Reveal, Eyebrow } from "@/components/Reveal";
import { services } from "@/data/content";
import usePageMeta from "@/hooks/usePageMeta";

const Services = () => {
  usePageMeta("Services", "Enterprise integration services: Dell Boomi iPaaS, SAP connectivity, B2B EDI, cloud integration architecture, API engineering and AI automation.");

  return (
    <div data-testid="services-page">
      <PageHero
        testId="services-hero"
        eyebrow="Services"
        title="Capabilities across the integration stack"
        description="Six disciplines, delivered with one standard: architecture first, documentation always, and handover your team can actually operate. Plus technical consulting when you need a senior second opinion."
      />

      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((s, i) => (
              <Reveal key={s.slug} delay={i * 0.05}>
                <Link
                  to={`/services/${s.slug}`}
                  data-testid={`services-page-card-${s.slug}`}
                  className="group flex flex-col h-full rounded-2xl border border-hairline bg-white p-8 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_12px_48px_rgba(37,99,235,0.12)] hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center transition-colors duration-300 group-hover:bg-electric">
                      <s.icon size={22} className="text-cyanglow" />
                    </div>
                    <ArrowRight size={20} className="text-slate-300 transition-all duration-300 group-hover:text-cyanglow group-hover:translate-x-1" />
                  </div>
                  <h2 className="mt-6 font-display text-2xl font-semibold text-slate-900">{s.name}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 flex-1">{s.short}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {s.stack.slice(0, 3).map((t) => (
                      <span key={t} className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                        {t}
                      </span>
                    ))}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <div className="mt-16 rounded-2xl border border-hairline bg-[#FAFAFA] p-8 lg:p-12 grid lg:grid-cols-2 gap-8 items-center" data-testid="consulting-band">
              <div>
                <Eyebrow>Technical consulting</Eyebrow>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Need a second opinion before a big decision?
                </h2>
                <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-600">
                  Architecture reviews, platform selection, migration feasibility, vendor evaluation.
                  Fixed-scope advisory engagements that end with a written recommendation you can act on —
                  whether or not you build with us afterwards.
                </p>
              </div>
              <div className="lg:text-right">
                <Link
                  to="/contact"
                  data-testid="consulting-cta"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-slate-900 text-white font-semibold transition-all duration-200 hover:bg-electric"
                >
                  Book an architecture review <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default Services;
