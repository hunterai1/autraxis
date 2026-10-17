export const inputCls =
  "w-full rounded-xl border border-hairline bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-cyanglow focus:ring-2 focus:ring-cyan-500/20 focus:outline-none";

export const inputClsDark =
  "w-full rounded-xl border border-cyan-500/20 bg-panel/70 px-4 py-3 text-sm text-frost placeholder:text-slate-500 transition-colors focus:border-cyanglow focus:ring-2 focus:ring-cyan-500/20 focus:outline-none";

export const labelCls = "block text-sm font-medium text-slate-700 mb-1.5";
export const labelClsDark = "block text-sm font-medium text-slate-300 mb-1.5";

export const Honeypot = ({ value, onChange }) => (
  <div className="absolute left-[-9999px] top-0" aria-hidden="true">
    <label htmlFor="hp-website">Website</label>
    <input
      id="hp-website"
      name="website"
      type="text"
      tabIndex={-1}
      autoComplete="off"
      value={value}
      onChange={onChange}
      data-testid="honeypot-field"
    />
  </div>
);
