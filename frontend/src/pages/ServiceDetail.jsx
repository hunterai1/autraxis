import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/Reveal";
import { services } from "@/data/content";
import usePageMeta from "@/hooks/usePageMeta";
import NotFound from "@/pages/NotFound";

const ServiceDetail = () => {
  const { slug } = useParams();
  const service = services.find((s) => s.slug === slug);
  usePageMeta(service ? service.name : "Service", service?.short);

  if (!service) return <NotFound />;

  const idx = services.findIndex((s) => s.slug === slug);
  const next = services[(idx + 1) % services.length];

  return (
    <div data-testid={`service-detail-${slug}`}>
      <section className="relative bg-abyss pt-[72px] overflow-hidden">
        <div className="absolute inset-0 bg-grid-dark opacity-60" aria-hidden="true" />
        <div className="absolute -top-32 right-0 w-[560px] h-[360px] rounded-full bg-electric/20 blur-[140px]" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 py-16 lg:py-24">
          <Reveal>
            <Link to="/services" data-testid="back-to-services-link" className="inline-flex items-center gap-2 text-sm text-mist hover:text-cyan-300 transition-colors mb-8">
              <ArrowLeft size={15} /> All services
            </Link>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-panel border border-cyan-500/30 flex items-center justify-center">
                <service.icon size={26} className="text-cyanglow" />
              </div>
              <Eyebrow dark>Service · {String(idx + 1).padStart(2, "0")}</Eyebrow>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-frost max-w-3xl">
              {service.name}
            </h1>
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-mist max-w-3xl">{service.summary}</p>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-14">
          <Reveal>
            <Eyebrow>What we deliver</Eyebrow>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Concrete outputs, not hours billed
            </h2>
            <ul className="mt-8 space-y-4">
              {service.deliverables.map((d) => (
                <li key={d} className="flex gap-3 text-sm sm:text-base leading-relaxed text-slate-700">
                  <CheckCircle2 size={18} className="text-cyanglow shrink-0 mt-0.5" />
                  {d}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.12}>
            <Eyebrow>How engagements run</Eyebrow>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              The same four moves, every time
            </h2>
            <ol className="mt-8 space-y-6">
              {service.approach.map((a, i) => (
                <li key={a.title} className="rounded-2xl border border-hairline bg-[#FAFAFA] p-6" data-testid={`approach-step-${i}`}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-electric">
                    Step {String(i + 1).padStart(2, "0")} · {a.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{a.text}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-8 mt-16">
          <Reveal>
            <div className="rounded-2xl border border-hairline bg-white p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-4">Typical stack &amp; standards</p>
              <div className="flex flex-wrap gap-2.5" data-testid="service-stack-chips">
                {service.stack.map((t) => (
                  <span key={t} className="font-mono text-xs px-3.5 py-1.5 rounded-full bg-slate-900 text-cyan-300">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-abyss border-t border-cyan-500/15 py-16">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Next capability</p>
            <Link to={`/services/${next.slug}`} data-testid="next-service-link" className="group mt-2 inline-flex items-center gap-3 font-display text-2xl font-semibold text-frost hover:text-cyan-300 transition-colors">
              {next.name}
              <ArrowRight size={20} className="text-cyanglow transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <Link
            to="/contact"
            data-testid="service-detail-cta"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-electric text-white font-semibold transition-all duration-200 hover:bg-cyanglow hover:text-abyss"
          >
            Discuss this capability <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ServiceDetail;
