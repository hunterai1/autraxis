import { Loader2, Inbox } from "lucide-react";

export const Card = ({ title, sub, children, testId, actions }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-testid={testId}>
    {(title || actions) && (
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          {title && <h2 className="font-display text-lg font-semibold text-slate-900">{title}</h2>}
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
        {actions}
      </div>
    )}
    {children}
  </div>
);

const PILL_COLORS = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
  archived: "bg-slate-100 text-slate-500 border-slate-200",
  new: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  reviewed: "bg-blue-50 text-blue-700 border-blue-200",
  shortlisted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  suspended: "bg-red-50 text-red-600 border-red-200",
  healthy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  degraded: "bg-amber-50 text-amber-700 border-amber-200",
  down: "bg-red-50 text-red-600 border-red-200",
  unknown: "bg-slate-100 text-slate-500 border-slate-200",
  not_configured: "bg-slate-100 text-slate-500 border-slate-200",
  ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
  denied: "bg-red-50 text-red-600 border-red-200",
  failed: "bg-red-50 text-red-600 border-red-200",
};

export const Pill = ({ value }) => (
  <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] font-semibold capitalize ${PILL_COLORS[value] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
    {String(value || "—").replace(/_/g, " ")}
  </span>
);

export const Empty = ({ text }) => (
  <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-3">
    <Inbox size={26} />
    <p className="text-sm">{text}</p>
  </div>
);

export const Loading = () => (
  <div className="flex items-center justify-center py-16 text-slate-400 gap-3" data-testid="admin-loading">
    <Loader2 size={18} className="animate-spin" /> Loading…
  </div>
);

export const Pagination = ({ page, pages, onPage, testId }) => (
  <div className="flex items-center justify-between mt-4" data-testid={testId}>
    <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}
      data-testid={`${testId}-prev`}
      className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 disabled:opacity-40 hover:border-cyanglow">
      ← Previous
    </button>
    <span className="text-xs text-slate-500 font-mono">Page {page} of {pages}</span>
    <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)}
      data-testid={`${testId}-next`}
      className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 disabled:opacity-40 hover:border-cyanglow">
      Next →
    </button>
  </div>
);

export const inputL = "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyanglow focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors";
export const labelL = "block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5";

export const Btn = ({ children, variant = "primary", ...props }) => {
  const styles = {
    primary: "bg-slate-900 text-white hover:bg-electric",
    accent: "bg-electric text-white hover:bg-cyanglow hover:text-abyss",
    ghost: "border border-slate-200 text-slate-600 hover:border-cyanglow hover:text-slate-900",
    danger: "border border-red-200 text-red-600 hover:bg-red-50",
  };
  return (
    <button type="button" {...props}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors disabled:opacity-50 ${styles[variant]} ${props.className || ""}`}>
      {children}
    </button>
  );
};
