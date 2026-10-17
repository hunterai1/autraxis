import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Activity } from "lucide-react";
import { api, fmtDate } from "@/admin/api";
import { Card, Pill, Loading } from "@/admin/components";
import usePageMeta from "@/hooks/usePageMeta";

const Dashboard = () => {
  usePageMeta("Dashboard", "AUTRAXIS Control Center dashboard.");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/admin/dashboard").then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p role="alert" className="text-sm text-red-600 rounded-xl border border-red-200 bg-red-50 px-4 py-3">{error}</p>;
  if (!data) return <Loading />;

  return (
    <div data-testid="admin-dashboard">
      <h1 className="font-display text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="text-sm text-slate-500 mt-1">Welcome back, {data.user.name || data.user.email}.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {data.inquiries && (
          <Card testId="dash-inquiries-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Inquiries</p>
            <p className="font-display text-3xl font-bold text-slate-900 mt-2">{data.inquiries.total}</p>
            <p className="text-xs text-slate-500 mt-1">{data.inquiries.unread} unread</p>
          </Card>
        )}
        {data.applications && (
          <Card testId="dash-applications-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Applications</p>
            <p className="font-display text-3xl font-bold text-slate-900 mt-2">{data.applications.total}</p>
            <p className="text-xs text-slate-500 mt-1">{data.applications.unread} unread</p>
          </Card>
        )}
        {data.jobs && (
          <Card testId="dash-jobs-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Job postings</p>
            <p className="font-display text-3xl font-bold text-slate-900 mt-2">{data.jobs.published}</p>
            <p className="text-xs text-slate-500 mt-1">{data.jobs.draft} drafts · {data.jobs.closed} closed</p>
          </Card>
        )}
        {data.content && (
          <Card testId="dash-content-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Content drafts</p>
            <p className="font-display text-3xl font-bold text-slate-900 mt-2">{data.content.drafts}</p>
            <p className="text-xs text-slate-500 mt-1">awaiting publication</p>
          </Card>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        {data.recent_inquiries && (
          <Card title="Recent inquiries" testId="dash-recent-inquiries"
            actions={<Link to="/admin/inquiries" className="text-xs font-semibold text-electric inline-flex items-center gap-1">View all <ArrowUpRight size={12} /></Link>}>
            {data.recent_inquiries.length === 0 ? (
              <p className="text-sm text-slate-400">No inquiries yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.recent_inquiries.map((i) => (
                  <li key={i.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{i.name} · {i.topic}</p>
                      <p className="text-xs text-slate-400">{fmtDate(i.created_at)}</p>
                    </div>
                    <Pill value={i.status || "new"} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
        {data.recent_audit && (
          <Card title="Recent administrative activity" testId="dash-recent-audit"
            actions={<Link to="/admin/audit" className="text-xs font-semibold text-electric inline-flex items-center gap-1">Audit log <ArrowUpRight size={12} /></Link>}>
            {data.recent_audit.length === 0 ? (
              <p className="text-sm text-slate-400">No activity recorded yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.recent_audit.map((a) => (
                  <li key={a.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate font-mono text-xs">{a.action}</p>
                      <p className="text-xs text-slate-400 truncate">{a.actor_email || "anonymous"} · {fmtDate(a.ts)}</p>
                    </div>
                    <Pill value={a.result} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>

      <Card className="mt-4" testId="dash-quick-actions">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Activity size={15} className="text-cyanglow" />
          Quick actions are available from the sidebar based on your role. System health lives in
          <Link to="/admin/monitoring" className="font-semibold text-electric">Monitoring</Link>.
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
