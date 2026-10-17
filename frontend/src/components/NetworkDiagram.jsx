import { useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const CENTER = { x: 400, y: 300 };

export const NODES = [
  {
    id: "sap",
    label: "SAP S/4HANA",
    sub: "ERP · IDoc / OData",
    x: 118, y: 118,
    color: "#2563EB",
    payload: '{ "idoc": "ORDERS05",\n  "partner": "VND-1042",\n  "items": 14,\n  "status": "queued" }',
    note: "Purchase orders and material master data leave the ERP through IDoc and OData endpoints.",
  },
  {
    id: "boomi",
    label: "Dell Boomi iPaaS",
    sub: "Atom · Process flow",
    x: 400, y: 70,
    color: "#06B6D4",
    payload: '{ "process": "order_sync",\n  "connector": "SAP → REST",\n  "map": "ord_v3.map",\n  "mode": "real-time" }',
    note: "The integration layer transforms, routes and orchestrates every document in flight.",
  },
  {
    id: "api",
    label: "API Gateway",
    sub: "REST · OAuth 2.0",
    x: 682, y: 118,
    color: "#38BDF8",
    payload: 'POST /v2/orders\nAuthorization: Bearer •••\n{ "sku": "AX-2210",\n  "qty": 400 }',
    note: "Managed APIs expose clean, secured contracts to partners and internal applications.",
  },
  {
    id: "edi",
    label: "B2B EDI Gate",
    sub: "X12 · AS2",
    x: 682, y: 482,
    color: "#2563EB",
    payload: 'ISA*00* *00* *ZZ*BUYER~\nST*850*0001~\nBEG*00*NE*PO-8841~',
    note: "Standardised X12 / EDIFACT documents move securely over AS2 with full audit trails.",
  },
  {
    id: "lake",
    label: "Cloud Data Lake",
    sub: "Storage · Analytics",
    x: 400, y: 532,
    color: "#06B6D4",
    payload: '{ "dataset": "orders_curated",\n  "rows": 18204,\n  "freshness": "real-time",\n  "quality": "passed" }',
    note: "Curated, governed data lands in the lake — ready for reporting, ML and AI workloads.",
  },
  {
    id: "agent",
    label: "AUTRAXIS AI Agent",
    sub: "Monitoring · Automation",
    x: 118, y: 482,
    color: "#38BDF8",
    payload: '{ "check": "flow_health",\n  "anomalies": 0,\n  "action": "none_required",\n  "next_run": "5m" }',
    note: "Automation agents watch every flow, flag anomalies and trigger remediation playbooks.",
  },
];

const NetworkDiagram = ({ interactive = true }) => {
  const [active, setActive] = useState(NODES[1]);
  const ref = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 16 });
  const sy = useSpring(my, { stiffness: 40, damping: 16 });
  const tx = useTransform(sx, [-1, 1], [-12, 12]);
  const ty = useTransform(sy, [-1, 1], [-8, 8]);

  const onMove = (e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };

  return (
    <div className="w-full" data-testid="network-diagram">
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={() => { mx.set(0); my.set(0); }}
        className="relative rounded-2xl border border-cyan-500/20 bg-panel/70 backdrop-blur-sm overflow-hidden"
      >
        <div className="absolute inset-0 bg-grid-dark opacity-70" aria-hidden="true" />
        <motion.div style={{ x: tx, y: ty }} className="relative">
          <svg viewBox="0 0 800 600" className="w-full h-auto" role="img" aria-label="Interactive enterprise integration architecture diagram">
            <defs>
              <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
              </radialGradient>
            </defs>

            {NODES.map((n) => {
              const pathId = `edge-${n.id}`;
              const d = `M ${CENTER.x} ${CENTER.y} L ${n.x} ${n.y}`;
              return (
                <g key={`e-${n.id}`}>
                  <path id={pathId} d={d} fill="none" stroke="rgba(56,189,248,0.22)" strokeWidth="1.2" />
                  <path d={d} fill="none" stroke={n.color} strokeWidth="1.2" className="edge-line" opacity="0.55" />
                  <circle r="3.5" fill={n.color} className="glow-cyan">
                    <animateMotion dur={`${3.4 + NODES.indexOf(n) * 0.7}s`} repeatCount="indefinite">
                      <mpath href={`#${pathId}`} />
                    </animateMotion>
                  </circle>
                  <circle r="2.2" fill="#F8FAFC" opacity="0.9">
                    <animateMotion dur={`${4.6 + NODES.indexOf(n) * 0.5}s`} repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear">
                      <mpath href={`#${pathId}`} />
                    </animateMotion>
                  </circle>
                </g>
              );
            })}

            <circle cx={CENTER.x} cy={CENTER.y} r="110" fill="url(#core-glow)" />
            <g>
              <rect x={CENTER.x - 96} y={CENTER.y - 34} width="192" height="68" rx="14" fill="#0B132B" stroke="#06B6D4" strokeOpacity="0.6" strokeWidth="1.4" />
              <text x={CENTER.x} y={CENTER.y - 6} textAnchor="middle" fill="#F8FAFC" fontFamily="Outfit, sans-serif" fontWeight="700" fontSize="17" letterSpacing="3">AUTRAXIS</text>
              <text x={CENTER.x} y={CENTER.y + 16} textAnchor="middle" fill="#06B6D4" fontFamily="'JetBrains Mono', monospace" fontSize="10" letterSpacing="2">INTEGRATION ENGINE</text>
            </g>

            {NODES.map((n) => (
              <g
                key={n.id}
                onClick={() => interactive && setActive(n)}
                onKeyDown={(e) => { if (interactive && (e.key === "Enter" || e.key === " ")) setActive(n); }}
                tabIndex={interactive ? 0 : -1}
                role={interactive ? "button" : undefined}
                aria-label={interactive ? `Inspect ${n.label} node` : undefined}
                data-testid={`diagram-node-${n.id}`}
                style={{ cursor: interactive ? "pointer" : "default" }}
              >
                <rect
                  x={n.x - 82} y={n.y - 26} width="164" height="52" rx="12"
                  fill={active.id === n.id ? "#0F172A" : "rgba(11,19,43,0.9)"}
                  stroke={n.color}
                  strokeOpacity={active.id === n.id ? 1 : 0.45}
                  strokeWidth={active.id === n.id ? 1.8 : 1.1}
                />
                <circle cx={n.x - 64} cy={n.y} r="4" fill={n.color} />
                <text x={n.x + 8} y={n.y - 3} textAnchor="middle" fill="#F8FAFC" fontFamily="Outfit, sans-serif" fontWeight="600" fontSize="13">{n.label}</text>
                <text x={n.x + 8} y={n.y + 14} textAnchor="middle" fill="#94A3B8" fontFamily="'JetBrains Mono', monospace" fontSize="9">{n.sub}</text>
              </g>
            ))}
          </svg>
        </motion.div>
      </div>

      {interactive && (
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-4 grid md:grid-cols-2 gap-4"
          data-testid="diagram-detail-panel"
        >
          <div className="rounded-xl border border-cyan-500/20 bg-panel/70 p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyanglow mb-2">Node · {active.label}</p>
            <p className="text-sm leading-relaxed text-slate-300">{active.note}</p>
          </div>
          <div className="rounded-xl border border-cyan-500/20 bg-abyss/80 p-5 overflow-x-auto">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-2">Sample payload — illustrative</p>
            <pre className="font-mono text-xs leading-relaxed text-skybright whitespace-pre">{active.payload}</pre>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default NetworkDiagram;
