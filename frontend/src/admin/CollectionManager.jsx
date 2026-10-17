import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { api, fmtDate, can } from "@/admin/api";
import { Card, Pill, Empty, Loading, Pagination, inputL, labelL, Btn } from "@/admin/components";
import usePageMeta from "@/hooks/usePageMeta";

export const COLLECTION_CONFIGS = {
  services: {
    title: "Services", singular: "service", writeCap: "content:write",
    statuses: ["draft", "published"],
    fields: [
      { k: "slug", label: "URL slug", required: true },
      { k: "name", label: "Name", required: true },
      { k: "short", label: "Short summary (card text)", type: "textarea", required: true },
      { k: "summary", label: "Full intro (detail page)", type: "textarea", required: true },
      { k: "deliverables", label: "Deliverables (one per line)", type: "lines" },
      { k: "stack", label: "Stack & standards (comma separated)", type: "csv" },
      { k: "approach", label: "Approach steps (JSON)", type: "json" },
    ],
    columns: ["name", "slug"],
  },
  solutions: {
    title: "Solutions & use cases", singular: "solution", writeCap: "content:write",
    statuses: ["draft", "published"],
    fields: [
      { k: "id", label: "ID (url-safe)", required: true },
      { k: "industry", label: "Industry", required: true },
      { k: "title", label: "Title", required: true },
      { k: "summary", label: "Summary", type: "textarea", required: true },
      { k: "flow", label: "Reference flow steps (one per line)", type: "lines" },
      { k: "stack", label: "Stack (comma separated)", type: "csv" },
    ],
    columns: ["title", "industry"],
  },
  projects: {
    title: "Projects & blueprints", singular: "project", writeCap: "content:write",
    statuses: ["draft", "published"],
    fields: [
      { k: "id", label: "ID (url-safe)", required: true },
      { k: "title", label: "Title", required: true },
      { k: "description", label: "Description", type: "textarea", required: true },
      { k: "tech", label: "Technologies (comma separated)", type: "csv" },
      { k: "highlights", label: "Design highlights (one per line)", type: "lines" },
    ],
    columns: ["title", "id"],
  },
  insights: {
    title: "Insights articles", singular: "article", writeCap: "content:write",
    statuses: ["draft", "published"],
    fields: [
      { k: "slug", label: "URL slug", required: true },
      { k: "title", label: "Title", required: true },
      { k: "tag", label: "Tag", required: true },
      { k: "date", label: "Date", type: "date", required: true },
      { k: "minutes", label: "Reading time (minutes)", type: "number" },
      { k: "excerpt", label: "Excerpt", type: "textarea", required: true },
      { k: "sections", label: "Sections (JSON: [{heading, body[]}])", type: "json" },
    ],
    columns: ["title", "tag"],
  },
  jobs: {
    title: "Job postings", singular: "job posting", writeCap: "jobs:write",
    statuses: ["draft", "published", "closed", "archived"],
    fields: [
      { k: "title", label: "Job title", required: true },
      { k: "department", label: "Department", required: true },
      { k: "employment_type", label: "Employment type", required: true },
      { k: "location", label: "Location / remote", required: true },
      { k: "description", label: "Description", type: "textarea", required: true },
      { k: "responsibilities", label: "Responsibilities (one per line)", type: "lines" },
      { k: "requirements", label: "Requirements (one per line)", type: "lines" },
      { k: "instructions", label: "How to apply", type: "textarea" },
      { k: "closing_date", label: "Closing date (optional)", type: "date" },
    ],
    columns: ["title", "department"],
  },
};

const toForm = (item, fields) => {
  const out = {};
  for (const f of fields) {
    const v = item?.[f.k];
    if (Array.isArray(v)) out[f.k] = f.type === "json" ? JSON.stringify(v, null, 2) : v.join(f.type === "csv" ? ", " : "\n");
    else if (v == null) out[f.k] = "";
    else out[f.k] = String(v);
  }
  return out;
};

const fromForm = (form, fields, base) => {
  const out = { ...base };
  for (const f of fields) {
    const raw = (form[f.k] ?? "").trim();
    if (f.type === "lines") out[f.k] = raw ? raw.split("\n").map((s) => s.trim()).filter(Boolean) : [];
    else if (f.type === "csv") out[f.k] = raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
    else if (f.type === "json") {
      if (!raw) { out[f.k] = []; continue; }
      try { out[f.k] = JSON.parse(raw); } catch { throw new Error(`'${f.label}' is not valid JSON`); }
    }
    else if (f.type === "number") out[f.k] = raw ? parseInt(raw, 10) : null;
    else if (f.type === "date") out[f.k] = raw || null;
    else out[f.k] = raw;
  }
  return out;
};

const CollectionManager = ({ name }) => {
  const cfg = COLLECTION_CONFIGS[name];
  usePageMeta(cfg.title, `${cfg.title} — AUTRAXIS Control Center.`);
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState(null); // null | {} for new | item
  const [form, setForm] = useState(null);
  const [formStatus, setFormStatus] = useState("draft");
  const [saving, setSaving] = useState(false);
  const writable = can(cfg.writeCap);

  const load = useCallback(async (p = page, st = status) => {
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (st) params.set("status", st);
      setData(await api(`/admin/collection/${name}?${params}`));
    } catch (e) { if (e.message !== "unauthorized") toast.error(e.message); }
  }, [name, page, status]);

  useEffect(() => { setPage(1); load(1); }, [status]); // eslint-disable-line
  useEffect(() => { load(page); }, [page]); // eslint-disable-line

  const openNew = () => { setEditing({}); setForm(toForm(null, cfg.fields)); setFormStatus("draft"); };
  const openEdit = (item) => { setEditing(item); setForm(toForm(item, cfg.fields)); setFormStatus(item.status || "draft"); };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...fromForm(form, cfg.fields, editing || {}), status: formStatus };
      if (editing?.id) {
        await api(`/admin/collection/${name}/${editing.id}`, { method: "PUT", body: JSON.stringify({ data: payload }) });
        toast.success("Saved.");
      } else {
        await api(`/admin/collection/${name}`, { method: "POST", body: JSON.stringify({ data: payload }) });
        toast.success("Created.");
      }
      setEditing(null);
      load();
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title || item.name}"? This cannot be undone.`)) return;
    try {
      await api(`/admin/collection/${name}/${item.id}`, { method: "DELETE" });
      toast.success("Deleted.");
      load();
    } catch (e) { toast.error(e.message); }
  };

  const setItemStatus = async (item, s) => {
    try {
      await api(`/admin/collection/${name}/${item.id}`, { method: "PUT", body: JSON.stringify({ data: { ...item, status: s } }) });
      toast.success(`Status set to ${s}.`);
      load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div data-testid={`collection-${name}-page`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">{cfg.title}</h1>
          <p className="text-sm text-slate-500 mt-1">Published items appear on the live site; drafts stay private.</p>
        </div>
        {writable && (
          <Btn variant="accent" onClick={openNew} data-testid="new-item-button"><Plus size={15} /> New {cfg.singular}</Btn>
        )}
      </div>

      <div className="mt-5">
        <select className={`${inputL} w-52`} value={status} data-testid="status-filter" onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {cfg.statuses.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      {!data ? <Loading /> : data.items.length === 0 ? (
        <Card className="mt-4"><Empty text={`No ${cfg.title.toLowerCase()} here yet.`} /></Card>
      ) : (
        <>
          <Card className="mt-4 !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="collection-table">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    {cfg.columns.map((c) => (
                      <th key={c} className="px-5 py-3 text-[10px] uppercase tracking-wider text-slate-400 font-semibold capitalize">{c}</th>
                    ))}
                    <th className="px-5 py-3 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Status</th>
                    <th className="px-5 py-3 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Updated</th>
                    <th className="px-5 py-3" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((item) => (
                    <tr key={item.id} data-testid={`collection-row-${item.id}`}>
                      {cfg.columns.map((c) => (
                        <td key={c} className="px-5 py-3.5 text-slate-800 max-w-[260px] truncate">{item[c]}</td>
                      ))}
                      <td className="px-5 py-3.5"><Pill value={item.status} /></td>
                      <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">{fmtDate(item.updated_at)}</td>
                      <td className="px-5 py-3.5">
                        {writable && (
                          <div className="flex items-center gap-2 justify-end">
                            <select value={item.status} onChange={(e) => setItemStatus(item, e.target.value)}
                              aria-label={`Set status for ${item.title || item.name}`}
                              data-testid={`row-status-${item.id}`}
                              className="rounded-full border border-slate-200 text-xs px-2.5 py-1.5 text-slate-600 bg-white">
                              {cfg.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <button type="button" onClick={() => openEdit(item)} aria-label="Edit" data-testid={`row-edit-${item.id}`}
                              className="w-8 h-8 rounded-full border border-slate-200 inline-flex items-center justify-center text-slate-500 hover:border-cyanglow hover:text-slate-900">
                              <Pencil size={13} />
                            </button>
                            <button type="button" onClick={() => remove(item)} aria-label="Delete" data-testid={`row-delete-${item.id}`}
                              className="w-8 h-8 rounded-full border border-red-200 inline-flex items-center justify-center text-red-500 hover:bg-red-50">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Pagination page={data.page} pages={data.pages} onPage={setPage} testId="collection-pagination" />
        </>
      )}

      {editing !== null && form && (
        <div className="fixed inset-0 z-50 bg-abyss/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 px-4"
          role="dialog" aria-modal="true" aria-label={`${editing?.id ? "Edit" : "New"} ${cfg.singular}`} data-testid="item-editor-modal">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl p-7">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-semibold text-slate-900">
                {editing?.id ? "Edit" : "New"} {cfg.singular}
              </h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close editor" data-testid="editor-close"
                className="w-9 h-9 rounded-full border border-slate-200 inline-flex items-center justify-center text-slate-500 hover:border-cyanglow">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {cfg.fields.map((f) => (
                <div key={f.k}>
                  <label className={labelL} htmlFor={`item-${f.k}`}>{f.label}{f.required ? " *" : ""}</label>
                  {f.type === "textarea" || f.type === "lines" || f.type === "json" ? (
                    <textarea id={`item-${f.k}`} rows={f.type === "json" ? 6 : 4}
                      className={`${inputL} resize-y ${f.type === "json" ? "font-mono text-xs" : ""}`}
                      data-testid={`item-field-${f.k}`} value={form[f.k] ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, [f.k]: e.target.value }))} />
                  ) : (
                    <input id={`item-${f.k}`} type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                      className={inputL} data-testid={`item-field-${f.k}`} value={form[f.k] ?? ""}
                      disabled={Boolean(editing?.id) && (f.k === "slug" || f.k === "id")}
                      onChange={(e) => setForm((p) => ({ ...p, [f.k]: e.target.value }))} />
                  )}
                </div>
              ))}
              <div>
                <label className={labelL} htmlFor="item-status">Status</label>
                <select id="item-status" className={inputL} value={formStatus} data-testid="item-status-select"
                  onChange={(e) => setFormStatus(e.target.value)}>
                  {cfg.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Only "published" {name === "jobs" ? "postings appear on the careers page" : "items appear on the live site"}.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Btn variant="ghost" onClick={() => setEditing(null)}>Cancel</Btn>
              <Btn variant="accent" onClick={save} disabled={saving} data-testid="item-save-button">
                {saving && <Loader2 size={14} className="animate-spin" />} Save
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionManager;
