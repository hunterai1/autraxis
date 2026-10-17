import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, BarChart3, LogOut, Mail, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
      if (!res.ok) throw new Error("Request failed");
      return res.json();
    },
    [navigate]
  );

  const load = useCallback(
    async (t) => {
      setLoading(true);
      try {
        if (t === "analytics") {
          setAnalytics(await authed("/admin/analytics?days=30"));
        } else {
          setData(await authed(`/admin/submissions?kind=${t}`));
        }
      } catch (err) {
        if (err.message !== "unauthorized") toast.error("Could not load data.");
      } finally {
        setLoading(false);
      }
    },
    [authed]
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
      await authed(`/admin/submissions/${kind}/${item.id}/read`, {
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

  const signOut = () => {
    localStorage.removeItem("ax_admin_token");
    navigate("/admin");
  };

  const TABS = [
    { id: "contact", label: "Inquiries", icon: Inbox },
    { id: "careers", label: "Applications", icon: Mail },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

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

        <div className="mt-8 flex gap-2 border-b border-cyan-500/15 pb-px" role="tablist" aria-label="Inbox sections">
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
              {t.id === "contact" && data.unread > 0 && tab !== "analytics" && (
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
            <div className="space-y-3" data-testid={`admin-list-${tab}`}>
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
                      <button
                        type="button"
                        onClick={() => toggleRead(tab, item)}
                        data-testid={`submission-read-toggle-${item.id}`}
                        className="mt-4 text-xs font-semibold px-4 py-2 rounded-full border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                      >
                        Mark as {item.read ? "unread" : "read"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminInbox;
