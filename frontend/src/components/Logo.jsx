export const LogoMark = ({ size = 36 }) => (
  <img
    src="/brand/icon-transparent.png"
    width={size}
    height={size}
    alt=""
    aria-hidden="true"
    data-testid="logo-mark"
    className="object-contain shrink-0"
    style={{ width: size, height: size }}
  />
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
