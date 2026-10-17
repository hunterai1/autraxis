const ITEMS = [
  "Dell Boomi iPaaS",
  "SAP S/4HANA Integration",
  "AS2 & EDI Standardisation",
  "Cloud Architecture",
  "Intelligent Process Automation",
  "Hybrid Cloud Synchronisation",
  "API Engineering",
  "Event-Driven Middleware",
];

const Marquee = () => (
  <div
    aria-hidden="true"
    data-testid="editorial-marquee"
    className="overflow-hidden border-y border-cyan-500/10 bg-panel/60 py-5 select-none"
  >
    <div className="marquee-track flex w-max items-center">
      {[...ITEMS, ...ITEMS].map((item, i) => (
        <span key={i} className="flex items-center shrink-0">
          <span className="font-display text-sm sm:text-base font-medium tracking-[0.18em] uppercase text-slate-400 px-8">
            {item}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyanglow/70 glow-cyan" />
        </span>
      ))}
    </div>
  </div>
);

export default Marquee;
