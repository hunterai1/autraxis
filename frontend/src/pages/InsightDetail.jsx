import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { useInsights } from "@/data/useCms";
import usePageMeta from "@/hooks/usePageMeta";
import NotFound from "@/pages/NotFound";

const formatDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

const InsightDetail = () => {
  const { slug } = useParams();
  const insights = useInsights();
  const article = insights.find((a) => a.slug === slug);
  usePageMeta(article ? article.title : "Insight", article?.excerpt);

  if (!article) return <NotFound />;

  return (
    <div data-testid={`insight-detail-${slug}`}>
      <section className="relative bg-abyss pt-[72px] overflow-hidden">
        <div className="absolute inset-0 bg-grid-dark opacity-50" aria-hidden="true" />
        <div className="relative max-w-3xl mx-auto px-5 sm:px-8 py-16 lg:py-24">
          <Reveal>
            <Link to="/insights" data-testid="back-to-insights-link" className="inline-flex items-center gap-2 text-sm text-mist hover:text-cyan-300 transition-colors mb-8">
              <ArrowLeft size={15} /> All insights
            </Link>
            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
              <span className="text-cyanglow">{article.tag}</span>
              <span aria-hidden="true">·</span>
              <span>{formatDate(article.date)}</span>
              <span aria-hidden="true">·</span>
              <span>{article.minutes} min read</span>
            </div>
            <h1 className="mt-5 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-frost leading-tight">
              {article.title}
            </h1>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <p className="text-lg leading-relaxed text-slate-700 font-medium border-l-4 border-cyanglow pl-6">
            {article.excerpt}
          </p>
          <div className="mt-12 space-y-12">
            {article.sections.map((s) => (
              <section key={s.heading}>
                <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900">{s.heading}</h2>
                {s.body.map((p, j) => (
                  <p key={j} className="mt-4 text-base leading-relaxed text-slate-600">{p}</p>
                ))}
                {s.code && (
                  <pre className="mt-5 rounded-xl bg-slate-900 p-5 font-mono text-xs leading-relaxed text-skybright overflow-x-auto">{s.code}</pre>
                )}
              </section>
            ))}
          </div>

          <div className="mt-16 rounded-2xl bg-abyss p-8 text-center" data-testid="article-cta">
            <h3 className="font-display text-xl font-semibold text-frost">Facing this problem right now?</h3>
            <p className="mt-2 text-sm text-mist">We work through exactly these decisions with clients every week.</p>
            <Link
              to="/contact"
              data-testid="article-contact-cta"
              className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-electric text-white text-sm font-semibold transition-all duration-200 hover:bg-cyanglow hover:text-abyss"
            >
              Talk to an engineer <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InsightDetail;
