import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserPlus, Loader2, ShieldAlert } from "lucide-react";
import { api, fmtDate } from "@/admin/api";
import { Card, Pill, Loading, inputL, labelL, Btn } from "@/admin/components";
import usePageMeta from "@/hooks/usePageMeta";

const ROLE_LABELS = {
  super_admin: "Super Admin", content_admin: "Content Admin",
  recruitment_admin: "Recruitment Admin", ops_admin: "Operations Admin", viewer: "Viewer / Auditor",
};

const Users = () => {
  usePageMeta("Users & Roles", "Administrator management — AUTRAXIS Control Center.");
  const [data, setData] = useState(null);
  const [invite, setInvite] = useState({ email: "", name: "", role: "viewer" });
  const [inviting, setInviting] = useState(false);
  const [reauth, setReauth] = useState(null); // {action: fn, label}
  const [reauthPw, setReauthPw] = useState("");

  const load = async () => {
    try { setData(await api("/admin/users")); } catch (e) { toast.error(e.message); }
  };
  useEffect(() => { load(); }, []);

  const sendInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await api("/admin/users/invite", { method: "POST", body: JSON.stringify(invite) });
      if (res.email_sent) toast.success(`Invitation emailed to ${invite.email}.`);
      else toast.warning("Account created but the email failed — copy the setup link from the server response.", { duration: 8000 });
      if (res.setup_url) toast.info(res.setup_url, { duration: 30000 });
      setInvite({ email: "", name: "", role: "viewer" });
      load();
    } catch (err) { toast.error(err.message); } finally { setInviting(false); }
  };

  const withReauth = (label, fn) => {
    setReauth({ label, fn });
    setReauthPw("");
  };

  const runReauthed = async () => {
    try {
      await reauth.fn(reauthPw);
      setReauth(null);
      load();
    } catch (e) { toast.error(e.message); }
  };

  const changeRole = (u, role) => withReauth(`change ${u.email}'s role to ${ROLE_LABELS[role]}`, async (pw) => {
    await api(`/admin/users/${u.id}`, { method: "PATCH", body: JSON.stringify({ role }), headers: { "X-Reauth-Password": pw } });
    toast.success("Role updated.");
  });

  const toggleStatus = (u) => withReauth(`${u.status === "active" ? "suspend" : "reactivate"} ${u.email}`, async (pw) => {
    await api(`/admin/users/${u.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: u.status === "active" ? "suspended" : "active" }),
      headers: { "X-Reauth-Password": pw },
    });
    toast.success("Account updated.");
  });

  const revoke = (u) => withReauth(`revoke all sessions for ${u.email}`, async (pw) => {
    await api(`/admin/users/${u.id}/revoke-sessions`, { method: "POST", headers: { "X-Reauth-Password": pw } });
    toast.success("Sessions revoked.");
  });

  const resetLink = async (u) => {
    try {
      const res = await api(`/admin/users/${u.id}/reset-link`, { method: "POST" });
      if (res.setup_url) toast.info(res.setup_url, { duration: 30000 });
      toast.success(res.status === "sent" ? "Reset link emailed." : "Email failed — copy the link shown.");
    } catch (e) { toast.error(e.message); }
  };

  if (!data) return <Loading />;

  return (
    <div data-testid="admin-users-page">
      <h1 className="font-display text-2xl font-bold text-slate-900">Users &amp; Roles</h1>
      <p className="text-sm text-slate-500 mt-1">Administrator accounts. Role changes, suspensions and session revocations require your password.</p>

      <Card title="Invite an administrator" sub="They receive a one-time setup link by email — no passwords are ever sent." className="mt-6" testId="invite-card">
        <form onSubmit={sendInvite} className="grid sm:grid-cols-4 gap-3" data-testid="invite-form">
          <input required placeholder="Full name" className={inputL} data-testid="invite-name"
            value={invite.name} onChange={(e) => setInvite((p) => ({ ...p, name: e.target.value }))} />
          <input required type="email" placeholder="Email" className={inputL} data-testid="invite-email"
            value={invite.email} onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))} />
          <select className={inputL} value={invite.role} data-testid="invite-role"
            onChange={(e) => setInvite((p) => ({ ...p, role: e.target.value }))}>
            {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <Btn variant="accent" className="justify-center" data-testid="invite-submit" disabled={inviting}>
            {inviting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} Invite
          </Btn>
        </form>
      </Card>

      <Card className="mt-4 !p-0 overflow-hidden" testId="users-table-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="users-table">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                {["User", "Role", "Status", "Last sign-in", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((u) => (
                <tr key={u.id} data-testid={`user-row-${u.id}`}>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-800">{u.name || "—"}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <select value={u.role} onChange={(e) => changeRole(u, e.target.value)}
                      aria-label={`Role for ${u.email}`} data-testid={`user-role-${u.id}`}
                      className="rounded-full border border-slate-200 text-xs px-2.5 py-1.5 text-slate-600 bg-white">
                      {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3.5"><Pill value={u.status} /></td>
                  <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">{fmtDate(u.last_login)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-2">
                      <Btn variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={() => toggleStatus(u)} data-testid={`user-toggle-${u.id}`}>
                        {u.status === "active" ? "Suspend" : "Reactivate"}
                      </Btn>
                      <Btn variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={() => revoke(u)} data-testid={`user-revoke-${u.id}`}>Revoke sessions</Btn>
                      <Btn variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={() => resetLink(u)} data-testid={`user-reset-${u.id}`}>Reset link</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {reauth && (
        <div className="fixed inset-0 z-50 bg-abyss/60 backdrop-blur-sm flex items-center justify-center px-4"
          role="dialog" aria-modal="true" aria-label="Confirm with password" data-testid="reauth-modal">
          <form onSubmit={(e) => { e.preventDefault(); runReauthed(); }} className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-7">
            <div className="flex items-center gap-3">
              <ShieldAlert size={20} className="text-amber-500" />
              <h2 className="font-display text-base font-semibold text-slate-900">Confirm a sensitive action</h2>
            </div>
            <p className="text-xs text-slate-500 mt-2">You're about to <strong>{reauth.label}</strong>. Enter your current admin password to confirm.</p>
            <label className={`${labelL} mt-4`} htmlFor="reauth-pw">Your password</label>
            <input id="reauth-pw" type="password" required autoComplete="current-password" autoFocus
              className={inputL} data-testid="reauth-password-input"
              value={reauthPw} onChange={(e) => setReauthPw(e.target.value)} />
            <div className="flex justify-end gap-2 mt-5">
              <Btn variant="ghost" onClick={() => setReauth(null)}>Cancel</Btn>
              <Btn variant="accent" data-testid="reauth-confirm">Confirm</Btn>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Users;
