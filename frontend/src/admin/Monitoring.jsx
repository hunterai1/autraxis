import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { api, fmtDate } from "@/admin/api";
import { Card, Pill, Loading, Btn } from "@/admin/components";
import usePageMeta from "@/hooks/usePageMeta";

const fmtUptime = (s) => {
  if (s == null) return "—";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s % 60}s`;
};

const Monitoring = () => {
  usePageMeta("Monitoring", "System health — AUTRAXIS Control Center.");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api("/admin/monitoring")); } catch (e) { if (e.message !== "unauthorized") toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!data) return <Loading />;

  return (
    <div data-testid="admin-monitoring-page">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Monitoring</h1>
          <p className="text-sm text-slate-500 mt-1">
            Live operational data from this server · checked {fmtDate(data.checked_at)} · version {data.version}
          </p>
        </div>
        <Btn variant="ghost" onClick={load} disabled={loading} data-testid="monitoring-refresh">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </Btn>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Card testId="mon-api">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Backend API</p>
          <div className="mt-2"><Pill value={data.api.status} /></div>
          <p className="text-xs text-slate-500 mt-2">Uptime {fmtUptime(data.api.uptime_seconds)}</p>
        </Card>
        <Card testId="mon-db">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Database</p>
          <div className="mt-2"><Pill value={data.database.status} /></div>
          <p className="text-xs text-slate-500 mt-2">Ping {data.database.ping_ms != null ? `${data.database.ping_ms} ms` : "—"}</p>
        </Card>
        <Card testId="mon-email">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email provider</p>
          <div className="mt-2"><Pill value={data.email.status} /></div>
          <p className="text-xs text-slate-500 mt-2">
            {data.email.last_attempt ? `Last attempt ${fmtDate(data.email.last_attempt)}` : data.email.note || "No sends recorded yet"}
          </p>
        </Card>
        <Card testId="mon-traffic">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">API traffic (since restart)</p>
          <p className="font-display text-2xl font-bold text-slate-900 mt-2">{data.traffic.requests_since_start}</p>
          <p className="text-xs text-slate-500 mt-1">
            avg {data.traffic.avg_response_ms} ms · max {data.traffic.max_response_ms} ms · {data.traffic.errors_since_start} errors
          </p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Card title="Data overview" testId="mon-counts">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {Object.entries(data.counts).map(([k, v]) => (
              <div key={k} className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                <dt className="text-[10px] uppercase tracking-wider text-slate-400">{k.replace(/_/g, " ")}</dt>
                <dd className="font-display text-xl font-bold text-slate-900 mt-1">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card title="Recent server errors" sub="HTTP 5xx and unhandled exceptions since the last restart" testId="mon-errors">
          {data.recent_errors.length === 0 ? (
            <p className="text-sm text-slate-400">No errors recorded since restart.</p>
          ) : (
            <ul className="space-y-2">
              {data.recent_errors.map((e, i) => (
                <li key={i} className="text-xs rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-red-700 font-mono">
                  {fmtDate(e.ts)} · {e.path} · {e.error}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="text-[11px] text-slate-400 mt-4">
        Frontend availability is implied by this page loading. Metrics are in-memory and reset on server restart; persistent
        infrastructure monitoring (uptime alerts, log shipping) requires external configuration — see DEPLOYMENT.md.
      </p>
    </div>
  );
};

export default Monitoring;
