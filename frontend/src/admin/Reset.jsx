import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2 } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { inputClsDark, labelClsDark } from "@/components/Form";
import { fmtError } from "@/admin/api";
import usePageMeta from "@/hooks/usePageMeta";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Reset = () => {
  usePageMeta("Set new password", "Set a new Control Center password.");
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [pw, setPw] = useState({ new_password: "", confirm: "" });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (pw.new_password !== pw.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: pw.new_password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(fmtError(data.detail));
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="admin-reset-page" className="relative bg-abyss min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-grid-dark opacity-50" aria-hidden="true" />
      <div className="relative w-full max-w-md mx-5 rounded-3xl border border-cyan-500/20 bg-panel/70 backdrop-blur-sm p-8 sm:p-10">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={48} />
          <h1 className="mt-5 font-display text-xl font-bold text-frost">Set a new password</h1>
        </div>
        {done ? (
          <div className="mt-8 text-center" data-testid="reset-success">
            <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
            <p className="mt-4 text-sm text-mist">Your password has been updated. All previous sessions were signed out.</p>
            <Link to="/admin/login" data-testid="reset-login-link"
              className="mt-6 inline-flex px-6 py-3 rounded-full bg-electric text-white text-sm font-semibold hover:bg-cyanglow hover:text-abyss transition-colors">
              Sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-5" data-testid="reset-form">
            {!token && (
              <p role="alert" className="text-sm text-red-400 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                This link is missing its token. Use the full link from your email.
              </p>
            )}
            <div>
              <label htmlFor="reset-new" className={labelClsDark}>New password (min 10 characters)</label>
              <input id="reset-new" type="password" required minLength={10} autoComplete="new-password"
                data-testid="reset-new-input" className={inputClsDark}
                value={pw.new_password} onChange={(e) => setPw((p) => ({ ...p, new_password: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="reset-confirm" className={labelClsDark}>Confirm new password</label>
              <input id="reset-confirm" type="password" required minLength={10} autoComplete="new-password"
                data-testid="reset-confirm-input" className={inputClsDark}
                value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} />
            </div>
            {error && (
              <p role="alert" data-testid="reset-error" className="text-sm text-red-400 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">{error}</p>
            )}
            <button type="submit" data-testid="reset-submit" disabled={loading || !token}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-electric text-white font-semibold hover:bg-cyanglow hover:text-abyss transition-colors disabled:opacity-60">
              {loading && <Loader2 size={16} className="animate-spin" />}
              Update password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Reset;
