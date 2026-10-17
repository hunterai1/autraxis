import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { api, download, fmtDate } from "@/admin/api";
import { Card, Pill, Empty, Loading, Pagination, inputL, labelL, Btn } from "@/admin/components";
import usePageMeta from "@/hooks/usePageMeta";

const Audit = () => {
  usePageMeta("Audit Logs", "Administrative audit log — AUTRAXIS Control Center.");
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ actor: "", action: "", result: "", date_from: "", date_to: "" });
  const [page, setPage] = useState(1);

  const load = useCallback(async (p = page, f = filters) => {
    try {
      const params = new URLSearchParams({ page: String(p) });
      for (const [k, v] of Object.entries(f)) if (v) params.set(k, v);
      setData(await api(`/admin/audit-logs?${params}`));
    } catch (e) { if (e.message !== "unauthorized") toast.error(e.message); }
  }, [page, filters]);

  useEffect(() => { load(page); }, [page]); // eslint-disable-line

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div data-testid="admin-audit-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Append-only record of administrative and security events. Secrets and personal message contents are never logged.
          </p>
        </div>
        <Btn variant="ghost" data-testid="audit-export-button"
          onClick={() => download("/admin/audit-export", "autraxis-audit-log.csv").then(() => toast.success("CSV downloaded.")).catch((e) => toast.error(e.message))}>
          <Download size={14} /> Export CSV
        </Btn>
      </div>

      <Card className="mt-6">
        <form className="grid grid-cols-2 lg:grid-cols-5 gap-3" onSubmit={(e) => { e.preventDefault(); setPage(1); load(1); }}>
          <div><label className={labelL}>Actor</label><input className={inputL} placeholder="email…" value={filters.actor} onChange={set("actor")} data-testid="audit-filter-actor" /></div>
          <div><label className={labelL}>Action</label><input className={inputL} placeholder="e.g. content" value={filters.action} onChange={set("action")} data-testid="audit-filter-action" /></div>
          <div><label className={labelL}>Result</label>
            <select className={inputL} value={filters.result} onChange={set("result")} data-testid="audit-filter-result">
              <option value="">Any</option><option value="ok">ok</option><option value="failed">failed</option><option value="denied">denied</option>
            </select></div>
          <div><label className={labelL}>From</label><input type="date" className={inputL} value={filters.date_from} onChange={set("date_from")} data-testid="audit-filter-from" /></div>
          <div><label className={labelL}>To</label><input type="date" className={inputL} value={filters.date_to} onChange={set("date_to")} data-testid="audit-filter-to" /></div>
          <div className="col-span-2 lg:col-span-5">
            <Btn variant="primary" data-testid="audit-apply-filters">Apply filters</Btn>
          </div>
        </form>
      </Card>

      {!data ? <Loading /> : data.items.length === 0 ? (
        <Card className="mt-4"><Empty text="No audit events match these filters." /></Card>
      ) : (
        <>
          <Card className="mt-4 !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="audit-table">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    {["Time (UTC)", "Actor", "Action", "Resource", "Result"].map((h) => (
                      <th key={h} className="px-5 py-3 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((a) => (
                    <tr key={a.id} data-testid={`audit-row-${a.id}`}>
                      <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap font-mono">{fmtDate(a.ts)}</td>
                      <td className="px-5 py-3 text-xs text-slate-700">{a.actor_email || "anonymous"}</td>
                      <td className="px-5 py-3 text-xs font-mono text-slate-800">{a.action}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{a.resource_type}{a.resource_id ? ` · ${String(a.resource_id).slice(0, 8)}` : ""}</td>
                      <td className="px-5 py-3"><Pill value={a.result} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Pagination page={data.page} pages={data.pages} onPage={setPage} testId="audit-pagination" />
        </>
      )}
    </div>
  );
};

export default Audit;
