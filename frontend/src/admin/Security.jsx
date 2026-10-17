import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api, fmtDate, setSession, getToken } from "@/admin/api";
import { Card, Loading, inputL, labelL, Btn, Pill } from "@/admin/components";
import usePageMeta from "@/hooks/usePageMeta";

const Security = () => {
  usePageMeta("Security", "Security settings — AUTRAXIS Control Center.");
  const [overview, setOverview] = useState(null);
  const [pw, setPw] = useState({ current_password: "", new_password: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/admin/security/overview").then(setOverview).catch((e) => { if (e.message !== "unauthorized") toast.error(e.message); });
  }, []);

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.new_password !== pw.confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const res = await api("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ current_password: pw.current_password, new_password: pw.new_password }),
      });
      if (res.token) {
        const user = JSON.parse(localStorage.getItem("ax_admin_user") || "null");
        setSession(res.token, user);
      }
      setPw({ current_password: "", new_password: "", confirm: "" });
      toast.success("Password updated.", { description: "Other sessions were signed out." });
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <div data-testid="admin-security-page">
      <h1 className="font-display text-2xl font-bold text-slate-900">Security</h1>
      <p className="text-sm text-slate-500 mt-1">Your account security and the platform's security posture.</p>

      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <Card title="Change my password" sub="All other sessions are signed out when the password changes." testId="security-password-card">
          <form onSubmit={changePassword} className="space-y-4" data-testid="change-password-form">
            <div>
              <label className={labelL} htmlFor="pw-current">Current password</label>
              <input id="pw-current" type="password" required autoComplete="current-password" className={inputL}
                data-testid="pw-current-input" value={pw.current_password}
                onChange={(e) => setPw((p) => ({ ...p, current_password: e.target.value }))} />
            </div>
            <div>
              <label className={labelL} htmlFor="pw-new">New password (min 10 characters)</label>
              <input id="pw-new" type="password" required minLength={10} autoComplete="new-password" className={inputL}
                data-testid="pw-new-input" value={pw.new_password}
                onChange={(e) => setPw((p) => ({ ...p, new_password: e.target.value }))} />
            </div>
            <div>
              <label className={labelL} htmlFor="pw-confirm">Confirm new password</label>
              <input id="pw-confirm" type="password" required minLength={10} autoComplete="new-password" className={inputL}
                data-testid="pw-confirm-input" value={pw.confirm}
                onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} />
            </div>
            <Btn variant="accent" data-testid="pw-submit-button" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />} Update password
            </Btn>
          </form>
        </Card>

        {!overview ? <Loading /> : (
          <div className="space-y-4">
            <Card title="Security posture" testId="security-posture-card">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <dt className="text-slate-500">Active login lockouts</dt>
                  <dd className="font-semibold text-slate-900">{overview.active_lockouts}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-slate-500">Session duration</dt>
                  <dd className="font-semibold text-slate-900">{overview.session_policy.token_ttl_hours} hours</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-slate-500">Session invalidation</dt>
                  <dd className="font-semibold text-slate-900">On password change, suspend, revoke</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-slate-500">CSRF</dt>
                  <dd className="font-semibold text-slate-900">Not applicable (Bearer tokens, no cookies)</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-slate-500">Multi-factor (TOTP)</dt>
                  <dd><Pill value="not_configured" /></dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-slate-500">My last sign-in</dt>
                  <dd className="font-semibold text-slate-900">{fmtDate(overview.my_last_login)}</dd>
                </div>
              </dl>
              <p className="text-[11px] text-slate-400 mt-4">{overview.mfa.note}. Failed logins are throttled: 5 attempts trigger a 15-minute lockout.</p>
            </Card>

            <Card title="My recent security events" testId="security-events-card">
              {overview.my_recent_events.length === 0 ? (
                <p className="text-sm text-slate-400">No events recorded yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {overview.my_recent_events.map((a) => (
                    <li key={a.id} className="py-2 flex items-center justify-between gap-3">
                      <span className="text-xs font-mono text-slate-700 truncate">{a.action}</span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">{fmtDate(a.ts)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Security;
