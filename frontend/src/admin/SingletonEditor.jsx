import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, RotateCcw } from "lucide-react";
import { api, fmtDate } from "@/admin/api";
import { Card, Loading, inputL, labelL, Btn } from "@/admin/components";
import usePageMeta from "@/hooks/usePageMeta";

const CONFIGS = {
  home: {
    title: "Homepage content",
    fields: [
      { k: "eyebrow", label: "Eyebrow (small heading)" },
      { k: "hero_lines", label: "Hero headline lines (one per line)", type: "lines" },
      { k: "subtitle", label: "Supporting paragraph", type: "textarea" },
      { k: "primary_cta", label: "Primary button label" },
      { k: "secondary_cta", label: "Secondary button label" },
      { k: "diagram_caption", label: "Diagram caption" },
    ],
  },
  about: {
    title: "About page content",
    fields: [
      { k: "intro_title", label: "Section title" },
      { k: "paragraphs", label: "Paragraphs (blank line separated)", type: "paragraphs" },
    ],
  },
};

const toForm = (data) => {
  const out = {};
  for (const [k, v] of Object.entries(data || {})) {
    out[k] = Array.isArray(v) ? v.join("\n\n") : String(v ?? "");
  }
  return out;
};

const fromForm = (form, fields) => {
  const out = {};
  for (const f of fields) {
    const raw = form[f.k] ?? "";
    if (f.type === "lines") out[f.k] = raw.split("\n").map((s) => s.trim()).filter(Boolean);
    else if (f.type === "paragraphs") out[f.k] = raw.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
    else out[f.k] = raw;
  }
  return out;
};

const SingletonEditor = ({ contentKey }) => {
  const cfg = CONFIGS[contentKey];
  usePageMeta(cfg.title, `${cfg.title} — AUTRAXIS Control Center.`);
  const [doc, setDoc] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const d = await api(`/admin/content/${contentKey}`);
      setDoc(d);
      setForm(toForm(d.draft || d.published));
    } catch (e) { toast.error(e.message); }
  };

  useEffect(() => { load(); }, [contentKey]); // eslint-disable-line

  const save = async (publish) => {
    if (publish && !window.confirm(publish ? "Publish these changes to the live website?" : "")) return;
    setSaving(true);
    try {
      const res = await api(`/admin/content/${contentKey}`, {
        method: "PUT",
        body: JSON.stringify({ data: fromForm(form, cfg.fields), publish }),
      });
      toast.success(res.status === "published" ? "Published to the live site." : "Draft saved.");
      load();
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };

  const revert = async (index) => {
    if (!window.confirm("Restore this previous published version?")) return;
    try {
      await api(`/admin/content/${contentKey}/revert`, { method: "POST", body: JSON.stringify({ index }) });
      toast.success("Previous version restored.");
      load();
    } catch (e) { toast.error(e.message); }
  };

  if (!doc || !form) return <Loading />;

  return (
    <div data-testid={`singleton-editor-${contentKey}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">{cfg.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {doc.draft ? "You have an unpublished draft." : "Editing the published version."} Last changed by {doc.updated_by} · {fmtDate(doc.updated_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <Btn variant="ghost" onClick={() => save(false)} disabled={saving} data-testid="save-draft-button">
            {saving && <Loader2 size={14} className="animate-spin" />} Save draft
          </Btn>
          <Btn variant="accent" onClick={() => save(true)} disabled={saving} data-testid="publish-button">Publish</Btn>
        </div>
      </div>

      <Card className="mt-6">
        <div className="space-y-5">
          {cfg.fields.map((f) => (
            <div key={f.k}>
              <label className={labelL} htmlFor={`field-${f.k}`}>{f.label}</label>
              {f.type === "textarea" || f.type === "paragraphs" ? (
                <textarea id={`field-${f.k}`} rows={f.type === "paragraphs" ? 8 : 4} className={`${inputL} resize-y`}
                  data-testid={`field-${f.k}`} value={form[f.k] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [f.k]: e.target.value }))} />
              ) : f.type === "lines" ? (
                <textarea id={`field-${f.k}`} rows={3} className={`${inputL} resize-y`}
                  data-testid={`field-${f.k}`} value={form[f.k] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [f.k]: e.target.value }))} />
              ) : (
                <input id={`field-${f.k}`} className={inputL} data-testid={`field-${f.k}`}
                  value={form[f.k] ?? ""} onChange={(e) => setForm((p) => ({ ...p, [f.k]: e.target.value }))} />
              )}
            </div>
          ))}
        </div>
      </Card>

      {(doc.revisions || []).length > 0 && (
        <Card title="Revision history" sub="Previously published versions — newest last" className="mt-4" testId="revision-history">
          <ul className="divide-y divide-slate-100">
            {doc.revisions.map((r, i) => (
              <li key={i} className="py-2.5 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Version {i + 1} · {r.by || "unknown"} · {fmtDate(r.at)}</p>
                <Btn variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={() => revert(i)} data-testid={`revert-${i}`}>
                  <RotateCcw size={12} /> Restore
                </Btn>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};

export default SingletonEditor;
