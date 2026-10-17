export const LogoMark = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" data-testid="logo-mark">
    <defs>
      <linearGradient id="ax-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#38BDF8" />
        <stop offset="1" stopColor="#2563EB" />
      </linearGradient>
    </defs>
    <path d="M32 13 L51 49 M32 13 L13 49 M20.5 35.5 L43.5 35.5" stroke="url(#ax-g)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="32" cy="13" r="4.5" fill="#06B6D4" />
    <circle cx="13" cy="49" r="4.5" fill="#2563EB" />
    <circle cx="51" cy="49" r="4.5" fill="#2563EB" />
    <circle cx="32" cy="35.5" r="3.2" fill="#38BDF8" />
  </svg>
);

const Logo = ({ compact = false }) => (
  <span className="inline-flex items-center gap-3" data-testid="brand-logo">
    <LogoMark size={compact ? 30 : 36} />
    <span className="flex flex-col leading-none">
      <span className="font-display font-bold tracking-[0.22em] text-frost text-base sm:text-lg">AUTRAXIS</span>
      {!compact && (
        <span className="font-mono text-[9px] tracking-[0.3em] text-cyanglow/80 mt-1 uppercase">Intelligence. Integrated.</span>
      )}
    </span>
  </span>
);

export default Logo;
