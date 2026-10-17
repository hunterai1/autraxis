import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, MailCheck } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { inputClsDark, labelClsDark } from "@/components/Form";
import usePageMeta from "@/hooks/usePageMeta";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Forgot = () => {
  usePageMeta("Reset access", "Request a Control Center password reset link.");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {}
    setLoading(false);
    setDone(true);
  };

  return (
    <div data-testid="admin-forgot-page" className="relative bg-abyss min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-grid-dark opacity-50" aria-hidden="true" />
      <div className="relative w-full max-w-md mx-5 rounded-3xl border border-cyan-500/20 bg-panel/70 backdrop-blur-sm p-8 sm:p-10">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={48} />
          <h1 className="mt-5 font-display text-xl font-bold text-frost">Reset access</h1>
        </div>
        {done ? (
          <div className="mt-8 text-center" data-testid="forgot-success">
            <MailCheck size={32} className="text-cyanglow mx-auto" />
            <p className="mt-4 text-sm text-mist leading-relaxed">
              If that account exists, a reset link is on its way. The link expires in 30 minutes and works once.
            </p>
            <Link to="/admin/login" className="mt-6 inline-block text-sm text-cyan-300 hover:underline">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-5" data-testid="forgot-form">
            <div>
              <label htmlFor="forgot-email" className={labelClsDark}>Administrator email</label>
              <input id="forgot-email" type="email" required data-testid="forgot-email-input"
                className={inputClsDark} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button type="submit" data-testid="forgot-submit" disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-electric text-white font-semibold hover:bg-cyanglow hover:text-abyss transition-colors disabled:opacity-60">
              {loading && <Loader2 size={16} className="animate-spin" />}
              Send reset link
            </button>
            <p className="text-center">
              <Link to="/admin/login" className="text-xs text-slate-500 hover:text-cyan-300 transition-colors">Back to sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Forgot;
