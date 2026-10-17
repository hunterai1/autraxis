export const LogoMark = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" data-testid="logo-mark">
    <defs>
      <linearGradient id="ax-arch" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#38BDF8" />
        <stop offset="1" stopColor="#2563EB" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="26" fill="none" stroke="#E2E8F0" strokeOpacity="0.4" strokeWidth="3.2" pathLength="100" strokeDasharray="86 14" strokeDashoffset="-32" strokeLinecap="round" />
    <path d="M15 47 C15 25 22 17 32 17 C42 17 49 25 49 47" fill="none" stroke="url(#ax-arch)" strokeWidth="5" strokeLinecap="round" />
    <circle cx="32" cy="33" r="6.5" fill="#2563EB" />
  </svg>
);

const Logo = ({ compact = false }) => (
  <span className="inline-flex items-center gap-3" data-testid="brand-logo">
    <LogoMark size={compact ? 30 : 36} />
    <span className="flex flex-col leading-none">
      <span className="font-display font-bold tracking-[0.22em] text-frost text-base sm:text-lg">AUTRAXIS</span>
      {!compact && (
        <span className="font-mono text-[9px] tracking-[0.42em] text-slate-400 mt-1.5 uppercase">Systems Inc.</span>
      )}
    </span>
  </span>
);

export default Logo;
