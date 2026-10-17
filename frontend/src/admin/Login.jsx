import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { inputClsDark, labelClsDark } from "@/components/Form";
import { setSession, fmtError } from "@/admin/api";
import usePageMeta from "@/hooks/usePageMeta";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Login = () => {
  usePageMeta("Control Center sign in", "AUTRAXIS Control Center sign in.");
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
      if (!res.ok) throw new Error(fmtError(data.detail));
      setSession(data.token, data.user);
      navigate("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="admin-login-page" className="relative bg-abyss min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-grid-dark opacity-50" aria-hidden="true" />
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 w-[520px] h-[320px] rounded-full bg-electric/20 blur-[140px]" aria-hidden="true" />
      <form onSubmit={submit} className="relative w-full max-w-md mx-5 rounded-3xl border border-cyan-500/20 bg-panel/70 backdrop-blur-sm p-8 sm:p-10" data-testid="admin-login-form">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={52} />
          <h1 className="mt-5 font-display text-2xl font-bold text-frost tracking-wide">CONTROL CENTER</h1>
          <p className="mt-2 text-sm text-mist inline-flex items-center gap-1.5">
            <Lock size={13} className="text-cyanglow" /> One place to manage your digital operations.
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
          <button type="submit" data-testid="admin-login-submit" disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-electric text-white font-semibold transition-all duration-200 hover:bg-cyanglow hover:text-abyss disabled:opacity-60">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <p className="text-center">
            <Link to="/admin/forgot" data-testid="forgot-password-link" className="text-xs text-slate-500 hover:text-cyan-300 transition-colors">
              Forgot your password?
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;
