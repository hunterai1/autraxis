import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, Mail, BarChart3, KeyRound, LogOut, ChevronDown, Loader2, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { inputClsDark, labelClsDark } from "@/components/Form";
import usePageMeta from "@/hooks/usePageMeta";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const fmtDate = (iso) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const AdminInbox = () => {
  usePageMeta("Submissions inbox", "AUTRAXIS admin submissions inbox.");
  const navigate = useNavigate();
  const [tab, setTab] = useState("contact");
  const [data, setData] = useState({ items: [], unread: 0, total: 0 });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [pw, setPw] = useState({ current_password: "", new_password: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);

  const authed = useCallback(
    async (path, opts = {}) => {
      const token = localStorage.getItem("ax_admin_token");
      const res = await fetch(`${API}${path}`, {
        ...opts,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
      });
      if (res.status === 401) {
        localStorage.removeItem("ax_admin_token");
        navigate("/admin");
        throw new Error("unauthorized");
      }
      return res;
    },
    [navigate]
  );

  const authedJson = useCallback(
    async (path, opts = {}) => {
      const res = await authed(path, opts);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.detail === "string" ? body.detail : "Request failed");
      }
      return res.json();
    },
    [authed]
  );

  const load = useCallback(
    async (t) => {
      if (t === "settings") {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        if (t === "analytics") {
          setAnalytics(await authedJson("/admin/analytics?days=30"));
        } else {
          setData(await authedJson(`/admin/submissions?kind=${t}`));
        }
      } catch (err) {
        if (err.message !== "unauthorized") toast.error("Could not load data.");
      } finally {
        setLoading(false);
      }
    },
    [authedJson]
  );

  useEffect(() => {
    if (!localStorage.getItem("ax_admin_token")) {
      navigate("/admin");
      return;
    }
    load(tab);
  }, [tab, load, navigate]);

  const toggleRead = async (kind, item) => {
    try {
      await authedJson(`/admin/submissions/${kind}/${item.id}/read`, {
        method: "PATCH",
        body: JSON.stringify({ read: !item.read }),
      });
      setData((d) => ({
        ...d,
        items: d.items.map((i) => (i.id === item.id ? { ...i, read: !i.read } : i)),
        unread: d.unread + (item.read ? 1 : -1),
      }));
    } catch {
      toast.error("Could not update the item.");
    }
  };

  const deleteItem = async (kind, item) => {
    if (!window.confirm(`Delete the submission from ${item.name}? This cannot be undone.`)) return;
    try {
      await authedJson(`/admin/submissions/${kind}/${item.id}`, { method: "DELETE" });
      setData((d) => ({
        ...d,
        items: d.items.filter((i) => i.id !== item.id),
        unread: item.read ? d.unread : d.unread - 1,
        total: d.total - 1,
      }));
      setExpanded(null);
      toast.success("Submission deleted.");
    } catch {
      toast.error("Could not delete the submission.");
    }
  };

  const exportCsv = async (kind) => {
    try {
      const res = await authed(`/admin/submissions/export?kind=${kind}`);
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `autraxis-${kind}-submissions.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded.");
    } catch (err) {
      if (err.message !== "unauthorized") toast.error("Could not export submissions.");
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.new_password !== pw.confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    setPwSaving(true);
    try {
      await authedJson("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ current_password: pw.current_password, new_password: pw.new_password }),
      });
      setPw({ current_password: "", new_password: "", confirm: "" });
      toast.success("Password updated.", { description: "Use the new password next time you sign in." });
    } catch (err) {
      toast.error(err.message === "unauthorized" ? "Session expired." : err.message);
    } finally {
      setPwSaving(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem("ax_admin_token");
    navigate("/admin");
  };

  const TABS = [
    { id: "contact", label: "Inquiries", icon: Inbox },
    { id: "careers", label: "Applications", icon: Mail },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: KeyRound },
  ];

  const isListTab = tab === "contact" || tab === "careers";

  return (
    <div data-testid="admin-inbox-page" className="bg-abyss min-h-screen pt-[72px]">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyanglow">Admin</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-frost">Submissions inbox</h1>
          </div>
          <button
            type="button"
            onClick={signOut}
            data-testid="admin-signout-button"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-cyan-500/30 text-mist text-sm font-medium hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors self-start"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 border-b border-cyan-500/15 pb-px" role="tablist" aria-label="Inbox sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              data-testid={`admin-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-t-xl border-b-2 transition-colors ${
                tab === t.id
                  ? "text-cyanglow border-cyanglow bg-cyan-500/5"
                  : "text-mist border-transparent hover:text-cyan-300"
              }`}
            >
              <t.icon size={15} /> {t.label}
              {t.id === "contact" && data.unread > 0 && isListTab && (
                <span className="ml-1 min-w-[20px] h-5 px-1.5 rounded-full bg-cyanglow text-abyss text-[11px] font-bold inline-flex items-center justify-center">
                  {data.unread}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-mist gap-3" data-testid="admin-loading">
              <Loader2 size={18} className="animate-spin" /> Loading…
            </div>
          ) : tab === "settings" ? (
            <div className="max-w-md" data-testid="admin-settings-panel">
              <form onSubmit={changePassword} className="rounded-2xl border border-cyan-500/20 bg-panel/70 p-7 space-y-5" data-testid="change-password-form">
                <div>
                  <h2 className="font-display text-xl font-semibold text-frost">Change admin password</h2>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    Takes effect immediately for future sign-ins. Minimum 10 characters.
                  </p>
                </div>
                <div>
                  <label htmlFor="pw-current" className={labelClsDark}>Current password</label>
                  <input id="pw-current" type="password" required autoComplete="current-password"
                    data-testid="pw-current-input" className={inputClsDark}
                    value={pw.current_password} onChange={(e) => setPw((p) => ({ ...p, current_password: e.target.value }))} />
                </div>
                <div>
                  <label htmlFor="pw-new" className={labelClsDark}>New password</label>
                  <input id="pw-new" type="password" required minLength={10} autoComplete="new-password"
                    data-testid="pw-new-input" className={inputClsDark}
                    value={pw.new_password} onChange={(e) => setPw((p) => ({ ...p, new_password: e.target.value }))} />
                </div>
                <div>
                  <label htmlFor="pw-confirm" className={labelClsDark}>Confirm new password</label>
                  <input id="pw-confirm" type="password" required minLength={10} autoComplete="new-password"
                    data-testid="pw-confirm-input" className={inputClsDark}
                    value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} />
                </div>
                <button
                  type="submit"
                  data-testid="pw-submit-button"
                  disabled={pwSaving}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-electric text-white text-sm font-semibold transition-all duration-200 hover:bg-cyanglow hover:text-abyss disabled:opacity-60"
                >
                  {pwSaving && <Loader2 size={15} className="animate-spin" />}
                  {pwSaving ? "Updating…" : "Update password"}
                </button>
              </form>
            </div>
          ) : tab === "analytics" && analytics ? (
            <div data-testid="admin-analytics-panel">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-cyan-500/20 bg-panel/70 p-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Total views · 30 days</p>
                  <p className="mt-2 font-display text-4xl font-bold text-frost" data-testid="analytics-total">{analytics.total}</p>
                </div>
                <div className="rounded-2xl border border-cyan-500/20 bg-panel/70 p-6 sm:col-span-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-3">Last 14 days</p>
                  <div className="flex items-end gap-1.5 h-16" data-testid="analytics-daily-bars">
                    {analytics.by_day.length === 0 && <p className="text-sm text-mist">No data yet — views appear as the site is visited.</p>}
                    {analytics.by_day.map((d) => {
                      const max = Math.max(...analytics.by_day.map((x) => x.views), 1);
                      return (
                        <div key={d.day} className="flex-1 bg-gradient-to-t from-electric to-cyanglow rounded-t" style={{ height: `${Math.max((d.views / max) * 100, 6)}%` }} title={`${d.day}: ${d.views} views`} />
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-panel/70 p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-4">Top pages · 30 days</p>
                <div className="space-y-3" data-testid="analytics-top-pages">
                  {analytics.by_path.length === 0 && <p className="text-sm text-mist">No pageviews recorded yet.</p>}
                  {analytics.by_path.map((p) => {
                    const max = analytics.by_path[0]?.views || 1;
                    return (
                      <div key={p.path} className="flex items-center gap-4">
                        <span className="font-mono text-xs text-slate-300 w-56 truncate shrink-0">{p.path}</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-electric to-cyanglow rounded-full" style={{ width: `${(p.views / max) * 100}%` }} />
                        </div>
                        <span className="font-mono text-xs text-cyanglow w-10 text-right">{p.views}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-5 text-xs text-slate-500">
                  Privacy-friendly by design: page paths only — no cookies, no IP addresses, no cross-site tracking.
                </p>
              </div>
            </div>
          ) : (
            <div data-testid={`admin-list-${tab}`}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-slate-500 font-mono">
                  {data.total} {tab === "contact" ? "inquiries" : "applications"} · {data.unread} unread
                </p>
                <button
                  type="button"
                  onClick={() => exportCsv(tab)}
                  data-testid="export-csv-button"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/10 transition-colors"
                >
                  <Download size={13} /> Export CSV
                </button>
              </div>
              <div className="space-y-3">
                {data.items.length === 0 && (
                  <p className="text-sm text-mist py-16 text-center">Nothing here yet — new {tab === "contact" ? "inquiries" : "applications"} will appear in this list.</p>
                )}
                {data.items.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border bg-panel/70 transition-colors ${item.read ? "border-slate-800" : "border-cyan-500/30"}`}
                    data-testid={`submission-${item.id}`}
                  >
                    <button
                      type="button"
                      className="w-full flex items-center gap-4 px-5 sm:px-6 py-4 text-left"
                      onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                      aria-expanded={expanded === item.id}
                      data-testid={`submission-toggle-${item.id}`}
                    >
                      {!item.read && <span className="w-2 h-2 rounded-full bg-cyanglow shrink-0" aria-label="Unread" />}
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm truncate ${item.read ? "text-slate-400" : "text-frost font-semibold"}`}>
                          {item.name} · {tab === "contact" ? item.topic : item.role}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{item.email}</p>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 shrink-0 hidden sm:block">{fmtDate(item.created_at)}</span>
                      <ChevronDown size={16} className={`text-slate-500 transition-transform ${expanded === item.id ? "rotate-180" : ""}`} />
                    </button>
                    {expanded === item.id && (
                      <div className="px-5 sm:px-6 pb-6 pt-1 border-t border-slate-800" data-testid={`submission-detail-${item.id}`}>
                        <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm mt-4">
                          <div><dt className="text-slate-500 text-xs uppercase tracking-wider">Email</dt>
                            <dd><a href={`mailto:${item.email}`} className="text-cyan-300 hover:underline">{item.email}</a></dd></div>
                          {item.company && <div><dt className="text-slate-500 text-xs uppercase tracking-wider">Company</dt><dd className="text-slate-300">{item.company}</dd></div>}
                          {item.linkedin && <div><dt className="text-slate-500 text-xs uppercase tracking-wider">LinkedIn / portfolio</dt><dd className="text-slate-300 break-all">{item.linkedin}</dd></div>}
                          <div><dt className="text-slate-500 text-xs uppercase tracking-wider">Received</dt><dd className="text-slate-300">{fmtDate(item.created_at)}</dd></div>
                        </dl>
                        <p className="mt-4 text-sm leading-relaxed text-slate-300 whitespace-pre-wrap rounded-xl bg-abyss/60 border border-slate-800 p-4">{item.message}</p>
                        <div className="mt-4 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleRead(tab, item)}
                            data-testid={`submission-read-toggle-${item.id}`}
                            className="text-xs font-semibold px-4 py-2 rounded-full border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                          >
                            Mark as {item.read ? "unread" : "read"}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteItem(tab, item)}
                            data-testid={`submission-delete-${item.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminInbox;
