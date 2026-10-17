import { useEffect, useState, useCallback } from "react";
import { Download, Trash2, ChevronDown, Search } from "lucide-react";
import { toast } from "sonner";
import { api, download, fmtDate, can } from "@/admin/api";
import { Card, Pill, Empty, Loading, Pagination, inputL, Btn } from "@/admin/components";
import usePageMeta from "@/hooks/usePageMeta";

const CONFIG = {
  inquiries: {
    title: "Inquiries", kind: "contact", testId: "inquiries",
    statuses: ["new", "in_progress", "resolved"],
    writeCap: "inquiries:write",
    subtitle: "Messages from the public contact form.",
  },
  applications: {
    title: "Applications", kind: "careers", testId: "applications",
    statuses: ["new", "reviewed", "shortlisted", "rejected"],
    writeCap: "applications:write",
    subtitle: "Candidate applications from the careers page. Handle personal data with care.",
  },
};

const Submissions = ({ kind }) => {
  const cfg = CONFIG[kind];
  usePageMeta(cfg.title, `${cfg.title} — AUTRAXIS Control Center.`);
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);
  const [note, setNote] = useState("");
  const writable = can(cfg.writeCap);

  const load = useCallback(async (p = page, query = q, st = status) => {
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (query) params.set("q", query);
      if (st) params.set("status", st);
      setData(await api(`/admin/submissions/${cfg.kind}?${params}`));
    } catch (e) {
      if (e.message !== "unauthorized") toast.error(e.message);
    }
  }, [cfg.kind, page, q, status]);

  useEffect(() => { load(1); setPage(1); }, [status]); // eslint-disable-line
  useEffect(() => { load(page); }, [page]); // eslint-disable-line

  const patch = async (item, body) => {
    try {
      await api(`/admin/submissions/${cfg.kind}/${item.id}`, { method: "PATCH", body: JSON.stringify(body) });
      toast.success("Updated.");
      load();
    } catch (e) { toast.error(e.message); }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete the submission from ${item.name}? This cannot be undone.`)) return;
    try {
      await api(`/admin/submissions/${cfg.kind}/${item.id}`, { method: "DELETE" });
      toast.success("Deleted.");
      setExpanded(null);
      load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div data-testid={`admin-${cfg.testId}-page`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">{cfg.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{cfg.subtitle}</p>
        </div>
        {can("export:data") && (
          <Btn variant="ghost" data-testid="export-csv-button"
            onClick={() => download(`/admin/submissions/${cfg.kind}/export`, `autraxis-${cfg.kind}-submissions.csv`).then(() => toast.success("CSV downloaded.")).catch((e) => toast.error(e.message))}>
            <Download size={14} /> Export CSV
          </Btn>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <form className="relative flex-1" onSubmit={(e) => { e.preventDefault(); setPage(1); load(1); }}>
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${inputL} pl-10`} placeholder="Search name, email, topic…" value={q}
            data-testid={`${cfg.testId}-search-input`} onChange={(e) => setQ(e.target.value)} />
        </form>
        <select className={`${inputL} sm:w-52`} value={status} data-testid={`${cfg.testId}-status-filter`}
          onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {cfg.statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      {!data ? <Loading /> : data.items.length === 0 ? (
        <Card className="mt-4"><Empty text={`No ${cfg.title.toLowerCase()} found.`} /></Card>
      ) : (
        <>
          <p className="text-xs text-slate-500 font-mono mt-4">{data.total} total · {data.unread} unread</p>
          <div className="space-y-3 mt-3">
            {data.items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm" data-testid={`submission-${item.id}`}>
                <button type="button" className="w-full flex items-center gap-4 px-5 py-4 text-left"
                  onClick={() => { setExpanded(expanded === item.id ? null : item.id); setNote(""); }}
                  aria-expanded={expanded === item.id} data-testid={`submission-toggle-${item.id}`}>
                  {!item.read && <span className="w-2 h-2 rounded-full bg-cyanglow shrink-0" aria-label="Unread" />}
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm truncate ${item.read ? "text-slate-500" : "text-slate-900 font-semibold"}`}>
                      {item.name} · {cfg.kind === "contact" ? item.topic : item.role}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{item.email}</p>
                  </div>
                  <Pill value={item.status || "new"} />
                  <span className="font-mono text-[10px] text-slate-400 hidden sm:block shrink-0">{fmtDate(item.created_at)}</span>
                  <ChevronDown size={15} className={`text-slate-400 transition-transform ${expanded === item.id ? "rotate-180" : ""}`} />
                </button>
                {expanded === item.id && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100" data-testid={`submission-detail-${item.id}`}>
                    <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm mt-3">
                      <div><dt className="text-[10px] uppercase tracking-wider text-slate-400">Email</dt>
                        <dd><a href={`mailto:${item.email}`} className="text-electric hover:underline">{item.email}</a></dd></div>
                      {item.company && <div><dt className="text-[10px] uppercase tracking-wider text-slate-400">Company</dt><dd className="text-slate-700">{item.company}</dd></div>}
                      {item.linkedin && <div><dt className="text-[10px] uppercase tracking-wider text-slate-400">LinkedIn / portfolio</dt><dd className="text-slate-700 break-all">{item.linkedin}</dd></div>}
                      <div><dt className="text-[10px] uppercase tracking-wider text-slate-400">Received</dt><dd className="text-slate-700">{fmtDate(item.created_at)}</dd></div>
                    </dl>
                    <p className="mt-3 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap rounded-xl bg-slate-50 border border-slate-100 p-4">{item.message}</p>
                    {(item.notes || []).length > 0 && (
                      <div className="mt-3 space-y-2">
                        {item.notes.map((n, i) => (
                          <p key={i} className="text-xs text-slate-500 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                            <span className="font-semibold text-amber-700">{n.by}</span> · {fmtDate(n.at)} — {n.text}
                          </p>
                        ))}
                      </div>
                    )}
                    {writable && (
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <select value={item.status || "new"} data-testid={`submission-status-${item.id}`}
                          onChange={(e) => patch(item, { status: e.target.value })}
                          className={`${inputL} w-44`}>
                          {cfg.statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                        </select>
                        <button type="button" onClick={() => patch(item, { read: !item.read })}
                          data-testid={`submission-read-toggle-${item.id}`}
                          className="text-xs font-semibold px-4 py-2 rounded-full border border-slate-200 text-slate-600 hover:border-cyanglow transition-colors">
                          Mark as {item.read ? "unread" : "read"}
                        </button>
                        <button type="button" onClick={() => remove(item)} data-testid={`submission-delete-${item.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    )}
                    {writable && (
                      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (note.trim()) { patch(item, { note: note.trim() }); } }}>
                        <input className={inputL} placeholder="Add an internal note (visible to admins only)…"
                          data-testid={`submission-note-input-${item.id}`}
                          value={expanded === item.id ? note : ""} onChange={(e) => setNote(e.target.value)} maxLength={2000} />
                        <Btn variant="ghost" data-testid={`submission-note-add-${item.id}`} className="shrink-0">Add note</Btn>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <Pagination page={data.page} pages={data.pages} onPage={setPage} testId={`${cfg.testId}-pagination`} />
        </>
      )}
    </div>
  );
};

export default Submissions;
