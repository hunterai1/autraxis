const FlowDiagram = ({ nodes, edges, testId }) => {
  const labels = [];
  return (
    <div className="relative rounded-2xl border border-cyan-500/20 bg-panel/70 overflow-hidden" data-testid={testId}>
      <div className="absolute inset-0 bg-grid-dark opacity-60" aria-hidden="true" />
      <svg viewBox="0 0 800 260" className="relative w-full h-auto" role="img" aria-label="Architecture flow diagram">
        {edges.map((e, i) => {
          const from = nodes.find((n) => n.id === e.from);
          const to = nodes.find((n) => n.id === e.to);
          if (!from || !to) return null;
          const pathId = `${testId}-edge-${i}`;
          const d = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
          if (e.label) labels.push({ x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 - 14, text: e.label });
          return (
            <g key={pathId}>
              <path id={pathId} d={d} fill="none" stroke="rgba(56,189,248,0.22)" strokeWidth="1.2" />
              <path d={d} fill="none" stroke="#06B6D4" strokeWidth="1.2" className="edge-line" opacity="0.55" />
              <circle r="3" fill="#38BDF8">
                <animateMotion dur={`${2.8 + i * 0.6}s`} repeatCount="indefinite">
                  <mpath href={`#${pathId}`} />
                </animateMotion>
              </circle>
            </g>
          );
        })}
        {nodes.map((n) => (
          <g key={n.id} data-testid={`${testId}-node-${n.id}`}>
            <rect x={n.x - 80} y={n.y - 25} width="160" height="50" rx="11" fill="rgba(11,19,43,0.95)" stroke={n.color || "#06B6D4"} strokeOpacity="0.55" strokeWidth="1.2" />
            <circle cx={n.x - 62} cy={n.y} r="3.5" fill={n.color || "#06B6D4"} />
            <text x={n.x + 6} y={n.y - 3} textAnchor="middle" fill="#F8FAFC" fontFamily="Outfit, sans-serif" fontWeight="600" fontSize="12.5">{n.label}</text>
            <text x={n.x + 6} y={n.y + 13} textAnchor="middle" fill="#94A3B8" fontFamily="'JetBrains Mono', monospace" fontSize="8.5">{n.sub}</text>
          </g>
        ))}
        {labels.map((l, i) => (
          <text key={`lbl-${i}`} x={l.x} y={l.y} textAnchor="middle" fill="#38BDF8" fontFamily="'JetBrains Mono', monospace" fontSize="9" opacity="0.85">
            {l.text}
          </text>
        ))}
      </svg>
    </div>
  );
};

export default FlowDiagram;
