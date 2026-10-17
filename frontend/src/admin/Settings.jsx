import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import { api, can, fmtDate } from "@/admin/api";
import { Card, Loading, inputL, labelL, Btn } from "@/admin/components";
import usePageMeta from "@/hooks/usePageMeta";

const TEXT_FIELDS = [
  { k: "brand_name", label: "Brand name" },
  { k: "legal_name", label: "Legal name (as displayed)" },
  { k: "tagline", label: "Tagline" },
  { k: "cta_text", label: "Header CTA button text" },
  { k: "footer_text", label: "Footer text" },
  { k: "copyright", label: "Copyright line ({year} is replaced automatically)" },
  { k: "seo_title", label: "SEO title" },
  { k: "seo_description", label: "SEO description", type: "textarea" },
];

const Settings = () => {
  usePageMeta("Site Settings", "Public website settings — AUTRAXIS Control Center.");
  const [doc, setDoc] = useState(null);
  const [form, setForm] = useState(null);
  const [socials, setSocials] = useState([]);
  const [saving, setSaving] = useState(false);
  const writable = can("settings:write");

  const load = async () => {
    try {
      const d = await api("/admin/content/settings");
      setDoc(d);
      const src = d.draft || d.published || {};
      const f = {};
      for (const { k } of TEXT_FIELDS) f[k] = src[k] ?? "";
      f.info_email = src.info_email ?? "";
      f.careers_email = src.careers_email ?? "";
      setForm(f);
      setSocials((src.socials || []).map((s) => ({ ...s })));
    } catch (e) { toast.error(e.message); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const save = async (publish) => {
    if (publish && !window.confirm("Publish these settings to the live website?")) return;
    setSaving(true);
    try {
      const data = { ...form, socials: socials.map((s, i) => ({ ...s, order: i + 1 })) };
      const res = await api("/admin/content/settings", { method: "PUT", body: JSON.stringify({ data, publish }) });
      toast.success(res.status === "published" ? "Settings published." : "Draft saved.");
      load();
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };

  const setSocial = (id, patch) => setSocials((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const move = (i, dir) => setSocials((list) => {
    const next = [...list];
    const j = i + dir;
    if (j < 0 || j >= next.length) return list;
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  if (!doc || !form) return <Loading />;

  return (
    <div data-testid="admin-settings-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Site Settings</h1>
          <p className="text-sm text-slate-500 mt-1">
            {doc.draft ? "You have an unpublished draft." : "Editing the published settings."} Last changed by {doc.updated_by} · {fmtDate(doc.updated_at)}
          </p>
        </div>
        {writable && (
          <div className="flex gap-2">
            <Btn variant="ghost" onClick={() => save(false)} disabled={saving} data-testid="settings-save-draft">
              {saving && <Loader2 size={14} className="animate-spin" />} Save draft
            </Btn>
            <Btn variant="accent" onClick={() => save(true)} disabled={saving} data-testid="settings-publish">Publish</Btn>
          </div>
        )}
      </div>
      {!writable && (
        <p className="mt-4 text-xs text-amber-700 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          You have read-only access to settings. Contact a Super Admin to make changes.
        </p>
      )}

      <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 mt-6 text-xs text-blue-800 flex gap-3" data-testid="email-infra-note">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <p>
          Changing the email addresses below updates only what the website displays and where form notifications are addressed
          in content. It does <strong>not</strong> modify Zoho Mail accounts, MX/SPF/DKIM/DMARC records, DNS, or any mail-provider
          configuration — those are changed separately by your mail administrator.
        </p>
      </div>

      <Card title="Public contact details" className="mt-4" testId="settings-contact-card">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelL} htmlFor="info_email">General inquiries email</label>
            <input id="info_email" type="email" className={inputL} disabled={!writable} data-testid="settings-info-email"
              value={form.info_email} onChange={(e) => setForm((p) => ({ ...p, info_email: e.target.value }))} />
          </div>
          <div>
            <label className={labelL} htmlFor="careers_email">Careers email</label>
            <input id="careers_email" type="email" className={inputL} disabled={!writable} data-testid="settings-careers-email"
              value={form.careers_email} onChange={(e) => setForm((p) => ({ ...p, careers_email: e.target.value }))} />
          </div>
        </div>
      </Card>

      <Card title="Brand & copy" className="mt-4" testId="settings-brand-card">
        <div className="grid sm:grid-cols-2 gap-4">
          {TEXT_FIELDS.map((f) => (
            <div key={f.k} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
              <label className={labelL} htmlFor={`set-${f.k}`}>{f.label}</label>
              {f.type === "textarea" ? (
                <textarea id={`set-${f.k}`} rows={3} className={`${inputL} resize-y`} disabled={!writable}
                  data-testid={`settings-${f.k}`} value={form[f.k]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.k]: e.target.value }))} />
              ) : (
                <input id={`set-${f.k}`} className={inputL} disabled={!writable} data-testid={`settings-${f.k}`}
                  value={form[f.k]} onChange={(e) => setForm((p) => ({ ...p, [f.k]: e.target.value }))} />
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card title="Social media links" sub="Only enabled links appear in the footer, in this order. https:// URLs only." className="mt-4" testId="settings-socials-card">
        <div className="space-y-3">
          {socials.map((s, i) => (
            <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3" data-testid={`social-row-${s.id}`}>
              <span className="text-sm font-semibold text-slate-700 w-28 shrink-0 capitalize">{s.label}</span>
              <input className={inputL} placeholder="https://…" disabled={!writable} data-testid={`social-url-${s.id}`}
                value={s.url} onChange={(e) => setSocial(s.id, { url: e.target.value, placeholder: false })} />
              <div className="flex items-center gap-2 shrink-0">
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                  <input type="checkbox" checked={Boolean(s.enabled)} disabled={!writable}
                    data-testid={`social-enabled-${s.id}`}
                    onChange={(e) => setSocial(s.id, { enabled: e.target.checked })} />
                  Enabled
                </label>
                <button type="button" aria-label="Move up" disabled={!writable || i === 0} onClick={() => move(i, -1)}
                  className="w-7 h-7 rounded-full border border-slate-200 text-slate-500 disabled:opacity-30">↑</button>
                <button type="button" aria-label="Move down" disabled={!writable || i === socials.length - 1} onClick={() => move(i, 1)}
                  className="w-7 h-7 rounded-full border border-slate-200 text-slate-500 disabled:opacity-30">↓</button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-3">
          Placeholder URLs are marked until replaced with verified company profiles. Third-party account passwords are never stored here.
        </p>
      </Card>
    </div>
  );
};

export default Settings;
