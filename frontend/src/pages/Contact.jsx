import { useState } from "react";
import { Mail, CheckCircle2, Loader2, Globe, Clock } from "lucide-react";
import { toast } from "sonner";
import PageHero from "@/components/PageHero";
import { Reveal, Eyebrow } from "@/components/Reveal";
import { inputCls, labelCls, Honeypot } from "@/components/Form";
import { TOPICS } from "@/data/content";
import { useContent } from "@/content/ContentContext";
import usePageMeta from "@/hooks/usePageMeta";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const EMPTY = { name: "", email: "", company: "", topic: TOPICS[0], message: "", website: "" };

const Contact = () => {
  usePageMeta("Contact", "Start a conversation with AUTRAXIS about enterprise integration, Dell Boomi, SAP connectivity, EDI, cloud architecture or AI automation.");
  const c = useContent();
  const infoEmail = c?.settings?.info_email || "info@autraxis.com";
  const careersEmail = c?.settings?.careers_email || "careers@autraxis.com";
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch(`${API}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Submission failed");
      }
      setDone(true);
    } catch (err) {
      toast.error("We couldn't send your message.", {
        description: `Please try again, or email ${infoEmail} directly.`,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div data-testid="contact-page">
      <PageHero
        testId="contact-hero"
        eyebrow="Contact"
        title="Start a conversation"
        description="Tell us about your landscape — what's connected, what isn't, and what keeps breaking. An engineer reads every message."
      />

      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-5 gap-14">
          <Reveal className="lg:col-span-2">
            <Eyebrow>Direct lines</Eyebrow>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Prefer plain email? So do we.
            </h2>
            <div className="mt-8 space-y-5">
              <a
                href={`mailto:${infoEmail}`}
                data-testid="contact-info-email"
                className="flex items-center gap-4 rounded-2xl border border-hairline bg-[#FAFAFA] p-5 transition-colors hover:border-cyan-500/50"
              >
                <Mail size={20} className="text-electric shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">General inquiries</p>
                  <p className="text-sm text-electric">{infoEmail}</p>
                </div>
              </a>
              <a
                href={`mailto:${careersEmail}`}
                data-testid="contact-careers-email"
                className="flex items-center gap-4 rounded-2xl border border-hairline bg-[#FAFAFA] p-5 transition-colors hover:border-cyan-500/50"
              >
                <Mail size={20} className="text-electric shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Careers &amp; recruitment</p>
                  <p className="text-sm text-electric">{careersEmail}</p>
                </div>
              </a>
              <div className="flex items-center gap-4 rounded-2xl border border-hairline bg-[#FAFAFA] p-5">
                <Globe size={20} className="text-electric shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Remote-first</p>
                  <p className="text-sm text-slate-600">Working with clients across time zones — no office visit required.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-hairline bg-[#FAFAFA] p-5">
                <Clock size={20} className="text-electric shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Response time</p>
                  <p className="text-sm text-slate-600">We typically reply within two business days.</p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-3">
            {done ? (
              <div className="h-full rounded-3xl bg-abyss relative overflow-hidden p-10 lg:p-14 flex flex-col items-start justify-center" data-testid="contact-success-panel">
                <div className="absolute inset-0 bg-grid-dark opacity-50" aria-hidden="true" />
                <div className="relative">
                  <CheckCircle2 size={40} className="text-emerald-400" />
                  <h2 className="mt-6 font-display text-3xl font-bold text-frost">Message received.</h2>
                  <p className="mt-3 text-mist max-w-md leading-relaxed">
                    Thank you — your inquiry is in our queue and an engineer will reply within two business days.
                    If it's urgent, email {infoEmail} directly.
                  </p>
                  <button
                    type="button"
                    data-testid="contact-send-another-button"
                    onClick={() => { setForm(EMPTY); setDone(false); }}
                    className="mt-8 px-6 py-3 rounded-full border border-cyan-500/40 text-cyan-300 text-sm font-semibold hover:bg-cyan-500/10 transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="relative rounded-3xl border border-hairline bg-[#FAFAFA] p-8 lg:p-10 space-y-5" data-testid="contact-form" noValidate={false}>
                <Honeypot value={form.website} onChange={set("website")} />
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="contact-name" className={labelCls}>Full name *</label>
                    <input id="contact-name" data-testid="contact-name-input" required minLength={2} maxLength={120}
                      className={inputCls} placeholder="Ada Lovelace" value={form.name} onChange={set("name")} />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className={labelCls}>Work email *</label>
                    <input id="contact-email" type="email" data-testid="contact-email-input" required
                      className={inputCls} placeholder="ada@company.com" value={form.email} onChange={set("email")} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="contact-company" className={labelCls}>Company</label>
                    <input id="contact-company" data-testid="contact-company-input" maxLength={160}
                      className={inputCls} placeholder="Company Ltd." value={form.company} onChange={set("company")} />
                  </div>
                  <div>
                    <label htmlFor="contact-topic" className={labelCls}>Topic *</label>
                    <select id="contact-topic" data-testid="contact-topic-select" required
                      className={inputCls} value={form.topic} onChange={set("topic")}>
                      {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="contact-message" className={labelCls}>Message *</label>
                  <textarea id="contact-message" data-testid="contact-message-input" required minLength={10} maxLength={4000} rows={6}
                    className={`${inputCls} resize-y`} placeholder="Tell us about the systems involved and what you're trying to achieve…"
                    value={form.message} onChange={set("message")} />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Submissions are stored securely and emailed to our team. We use your details only to respond to
                  this inquiry — see our <a href="/privacy" className="text-electric underline underline-offset-2">privacy policy</a>.
                </p>
                <button
                  type="submit"
                  data-testid="contact-submit-button"
                  disabled={sending}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-slate-900 text-white font-semibold transition-all duration-200 hover:bg-electric disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sending && <Loader2 size={17} className="animate-spin" />}
                  {sending ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default Contact;
