import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { insights } from "@/data/content";
import usePageMeta from "@/hooks/usePageMeta";

const formatDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

const Insights = () => {
  usePageMeta("Insights", "Technical articles on iPaaS migration, SAP BTP integration and event-driven EDI from AUTRAXIS engineers.");

  return (
    <div data-testid="insights-page">
      <PageHero
        testId="insights-hero"
        eyebrow="Insights"
        title="Field notes from the integration layer"
        description="Long-form engineering writing on the platforms and patterns we work with — no vendor cheerleading, no recycled listicles."
      />

      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 space-y-6">
          {insights.map((a, i) => (
            <Reveal key={a.slug} delay={i * 0.05}>
              <Link
                to={`/insights/${a.slug}`}
                data-testid={`insights-article-${a.slug}`}
                className="group grid md:grid-cols-4 gap-6 rounded-2xl border border-hairline bg-white p-8 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_12px_48px_rgba(37,99,235,0.1)]"
              >
                <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500 space-y-2">
                  <p className="text-electric">{a.tag}</p>
                  <p>{formatDate(a.date)}</p>
                  <p>{a.minutes} min read</p>
                </div>
                <div className="md:col-span-3">
                  <h2 className="font-display text-xl sm:text-2xl font-semibold leading-snug text-slate-900 group-hover:text-electric transition-colors">
                    {a.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{a.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-electric group-hover:text-cyanglow transition-colors">
                    Read article <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Insights;
