import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { LogoMark } from "@/components/Logo";
import { inputClsDark, labelClsDark } from "@/components/Form";
import usePageMeta from "@/hooks/usePageMeta";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const formatApiErrorDetail = (detail) => {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => (e && e.msg) || JSON.stringify(e)).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
};

const AdminLogin = () => {
  usePageMeta("Admin sign in", "AUTRAXIS admin sign in.");
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(formatApiErrorDetail(data.detail));
      localStorage.setItem("ax_admin_token", data.token);
      navigate("/admin/inbox");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="admin-login-page" className="relative bg-abyss min-h-screen pt-[72px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-grid-dark opacity-50" aria-hidden="true" />
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 w-[520px] h-[320px] rounded-full bg-electric/20 blur-[140px]" aria-hidden="true" />
      <Reveal className="relative w-full max-w-md px-5">
        <form onSubmit={submit} className="rounded-3xl border border-cyan-500/20 bg-panel/70 backdrop-blur-sm p-8 sm:p-10" data-testid="admin-login-form">
          <div className="flex flex-col items-center text-center">
            <LogoMark size={52} />
            <h1 className="mt-5 font-display text-2xl font-bold text-frost">Admin sign in</h1>
            <p className="mt-2 text-sm text-mist inline-flex items-center gap-1.5">
              <Lock size={13} className="text-cyanglow" /> Submissions inbox &amp; analytics
            </p>
          </div>
          <div className="mt-8 space-y-5">
            <div>
              <label htmlFor="admin-email" className={labelClsDark}>Email</label>
              <input id="admin-email" type="email" required autoComplete="username"
                data-testid="admin-email-input" className={inputClsDark}
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label htmlFor="admin-password" className={labelClsDark}>Password</label>
              <input id="admin-password" type="password" required autoComplete="current-password"
                data-testid="admin-password-input" className={inputClsDark}
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && (
              <p role="alert" data-testid="admin-login-error" className="text-sm text-red-400 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                {error}
              </p>
            )}
            <button
              type="submit"
              data-testid="admin-login-submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-electric text-white font-semibold transition-all duration-200 hover:bg-cyanglow hover:text-abyss disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>
      </Reveal>
    </div>
  );
};

export default AdminLogin;
