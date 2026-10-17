import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard, Inbox, Mail, FileText, Settings2, Users, ScrollText,
  Activity, ShieldCheck, LogOut, Menu, X,
} from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { api, getToken, getUser, clearSession, can } from "@/admin/api";

const NAV = [
  { to: "/admin", end: true, label: "Dashboard", icon: LayoutDashboard, cap: "dashboard:view" },
  { to: "/admin/inquiries", label: "Inquiries", icon: Inbox, cap: "inquiries:read" },
  { to: "/admin/applications", label: "Applications", icon: Mail, cap: "applications:read" },
  { to: "/admin/content", label: "Content", icon: FileText, cap: "content:read" },
  { to: "/admin/monitoring", label: "Monitoring", icon: Activity, cap: "monitoring:view" },
  { to: "/admin/audit", label: "Audit Logs", icon: ScrollText, cap: "audit:view" },
  { to: "/admin/users", label: "Users & Roles", icon: Users, cap: "users:manage" },
  { to: "/admin/settings", label: "Site Settings", icon: Settings2, cap: "content:read" },
  { to: "/admin/security", label: "Security", icon: ShieldCheck, cap: "dashboard:view" },
];

const ROLE_LABELS = {
  super_admin: "Super Admin", content_admin: "Content Admin",
  recruitment_admin: "Recruitment Admin", ops_admin: "Operations Admin", viewer: "Viewer",
};

const AdminLayout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    meta.setAttribute("data-admin-noindex", "true");
    document.head.appendChild(meta);
    return () => { document.head.querySelector('meta[data-admin-noindex]')?.remove(); };
  }, []);

  useEffect(() => {
    if (!getToken()) {
      navigate("/admin/login");
      return;
    }
    api("/auth/me")
      .then((u) => { setUser(u); setReady(true); })
      .catch(() => {});
  }, [navigate]);

  const signOut = async () => {
    try { await api("/auth/logout", { method: "POST" }); } catch {}
    clearSession();
    navigate("/admin/login");
  };

  if (!ready || !user) return null;

  const visibleNav = NAV.filter((n) => can(n.cap));

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-6 border-b border-cyan-500/15">
        <div className="flex items-center gap-3">
          <LogoMark size={34} />
          <div>
            <p className="font-display font-bold tracking-[0.14em] text-frost text-sm leading-tight">AUTRAXIS</p>
            <p className="font-mono text-[9px] tracking-[0.22em] text-cyanglow uppercase mt-0.5">Control Center</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-slate-500 leading-snug">One place to manage your digital operations.</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Admin" data-testid="admin-nav">
        {visibleNav.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setMenuOpen(false)}
            data-testid={`admin-nav-${n.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? "bg-cyan-500/10 text-cyanglow" : "text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/5"
              }`
            }>
            <n.icon size={16} /> {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-cyan-500/15">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-300 truncate">{user.name || user.email}</p>
            <p className="text-[10px] font-mono text-cyanglow uppercase tracking-wider">{ROLE_LABELS[user.role] || user.role}</p>
          </div>
          <button type="button" onClick={signOut} aria-label="Sign out" data-testid="admin-signout-button"
            className="w-9 h-9 rounded-full border border-cyan-500/25 text-slate-400 inline-flex items-center justify-center hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors shrink-0">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F6FA]" data-testid="admin-layout">
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-abyss border-r border-cyan-500/15 z-40">
        {sidebar}
      </aside>

      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-abyss border-b border-cyan-500/15 px-4 h-14 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2.5">
          <LogoMark size={26} />
          <span className="font-display font-bold tracking-[0.14em] text-frost text-xs">CONTROL CENTER</span>
        </Link>
        <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen} aria-label="Toggle admin menu"
          data-testid="admin-mobile-menu-toggle"
          className="w-10 h-10 rounded-full border border-cyan-500/25 text-slate-300 inline-flex items-center justify-center">
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-abyss/95 pt-14" data-testid="admin-mobile-menu">
          {sidebar}
        </div>
      )}

      <main className="lg:pl-64 pt-14 lg:pt-0 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
          {user.must_change_password && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800" data-testid="must-change-password-banner">
              Your account uses a temporary setup password. <Link to="/admin/security" className="font-semibold underline underline-offset-2">Change it now in Security</Link>.
            </div>
          )}
          <Outlet context={{ user }} />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
