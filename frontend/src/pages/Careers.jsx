import { useState } from "react";
import { CheckCircle2, Loader2, MapPin, Briefcase, Mail, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import PageHero from "@/components/PageHero";
import { Reveal, Eyebrow } from "@/components/Reveal";
import { inputCls, labelCls, Honeypot } from "@/components/Form";
import { useContent } from "@/content/ContentContext";
import usePageMeta from "@/hooks/usePageMeta";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const EMPTY = { name: "", email: "", role: "", linkedin: "", message: "", website: "" };

const fmtClosing = (d) => {
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch { return d; }
};

const Careers = () => {
  usePageMeta("Careers", "Remote-first engineering roles at AUTRAXIS: integration engineering, SAP connectivity and AI automation.");
  const c = useContent();
  const jobs = c?.jobs || [];
  const careersEmail = c?.settings?.careers_email || "careers@autraxis.com";
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch(`${API}/careers`, {
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
      toast.error("We couldn't submit your application.", {
        description: `Please try again, or email ${careersEmail} directly.`,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div data-testid="careers-page">
      <PageHero
        testId="careers-hero"
        eyebrow="Careers"
        title="Do the best integration work of your career — from wherever you are"
        description="We're a remote-first practice. That means written communication, asynchronous defaults, and colleagues chosen for craft rather than commute."
      />

      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal>
            <Eyebrow>Open roles</Eyebrow>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Current openings</h2>
          </Reveal>

          {jobs.length === 0 ? (
            <Reveal>
              <div className="mt-12 rounded-2xl border border-hairline bg-[#FAFAFA] p-10 text-center" data-testid="no-open-roles">
                <p className="font-display text-xl font-semibold text-slate-900">No open roles right now</p>
                <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                  We hire selectively. Send a general application below — we read every one and keep promising profiles on file.
                </p>
              </div>
            </Reveal>
          ) : (
            <div className="mt-12 space-y-6" data-testid="jobs-list">
              {jobs.map((j, i) => (
                <Reveal key={j.id} delay={i * 0.05}>
                  <article className="rounded-2xl border border-hairline bg-[#FAFAFA] p-8 lg:p-10" data-testid={`job-card-${j.id}`}>
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      <div>
                        <h3 className="font-display text-xl sm:text-2xl font-semibold text-slate-900">{j.title}</h3>
                        <div className="mt-3 flex flex-wrap items-center gap-4 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
                          <span className="inline-flex items-center gap-1.5"><MapPin size={12} className="text-electric" /> {j.location}</span>
                          <span className="inline-flex items-center gap-1.5"><Briefcase size={12} className="text-electric" /> {j.employment_type}</span>
                          {j.department && <span>{j.department}</span>}
                          {j.closing_date && (
                            <span className="inline-flex items-center gap-1.5 text-amber-600">
                              <CalendarClock size={12} /> Closes {fmtClosing(j.closing_date)}
                            </span>
                          )}
                        </div>
                        <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-600 max-w-3xl">{j.description}</p>
                      </div>
                      <a
                        href="#apply"
                        data-testid={`job-apply-${j.id}`}
                        onClick={() => setForm((f) => ({ ...f, role: j.title }))}
                        className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white text-sm font-semibold transition-colors hover:bg-electric"
                      >
                        Apply for this role
                      </a>
                    </div>
                    {(j.requirements || []).length > 0 && (
                      <div className="mt-6 pt-6 border-t border-hairline">
                        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-3">What you'll need</p>
                        <ul className="grid sm:grid-cols-2 gap-2.5">
                          {j.requirements.map((m) => (
                            <li key={m} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
                              <CheckCircle2 size={16} className="text-cyanglow shrink-0 mt-0.5" /> {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(j.responsibilities || []).length > 0 && (
                      <div className="mt-6">
                        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-3">What you'll do</p>
                        <ul className="grid gap-2.5">
                          {j.responsibilities.map((r) => (
                            <li key={r} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
                              <CheckCircle2 size={16} className="text-electric shrink-0 mt-0.5" /> {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {j.instructions && (
                      <p className="mt-6 text-xs text-slate-500 italic">{j.instructions}</p>
                    )}
                  </article>
                </Reveal>
              ))}
            </div>
          )}

          <Reveal delay={0.1}>
            <div className="mt-16 grid lg:grid-cols-5 gap-10 items-start" id="apply">
              <div className="lg:col-span-2">
                <Eyebrow>Apply</Eyebrow>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Introduce yourself
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  No cover letter theatre. Tell us what you've built, what broke, and what you learned.
                  Applications are reviewed by engineers and every one gets a reply. Prefer email? Write to
                  <a href={`mailto:${careersEmail}`} data-testid="careers-direct-email" className="text-electric underline underline-offset-2 ml-1">{careersEmail}</a>.
                </p>
              </div>

              <div className="lg:col-span-3">
                {done ? (
                  <div className="rounded-3xl bg-abyss relative overflow-hidden p-10" data-testid="careers-success-panel">
                    <div className="absolute inset-0 bg-grid-dark opacity-50" aria-hidden="true" />
                    <div className="relative">
                      <CheckCircle2 size={36} className="text-emerald-400" />
                      <h3 className="mt-5 font-display text-2xl font-bold text-frost">Application received.</h3>
                      <p className="mt-3 text-mist text-sm leading-relaxed max-w-md">
                        Thank you for your interest in AUTRAXIS. We review every application and will reply to yours.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={submit} className="relative rounded-3xl border border-hairline bg-white p-8 space-y-5" data-testid="careers-form">
                    <Honeypot value={form.website} onChange={set("website")} />
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="careers-name" className={labelCls}>Full name *</label>
                        <input id="careers-name" data-testid="careers-name-input" required minLength={2} maxLength={120}
                          className={inputCls} value={form.name} onChange={set("name")} />
                      </div>
                      <div>
                        <label htmlFor="careers-email" className={labelCls}>Email *</label>
                        <input id="careers-email" type="email" data-testid="careers-email-input" required
                          className={inputCls} value={form.email} onChange={set("email")} />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="careers-role" className={labelCls}>Role *</label>
                        <select id="careers-role" data-testid="careers-role-select" required className={inputCls} value={form.role} onChange={set("role")}>
                          <option value="" disabled>Select a role</option>
                          {jobs.map((j) => <option key={j.id} value={j.title}>{j.title}</option>)}
                          <option value="General application">General application</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="careers-linkedin" className={labelCls}>LinkedIn / portfolio</label>
                        <input id="careers-linkedin" data-testid="careers-linkedin-input" maxLength={300}
                          className={inputCls} placeholder="https://…" value={form.linkedin} onChange={set("linkedin")} />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="careers-message" className={labelCls}>About you *</label>
                      <textarea id="careers-message" data-testid="careers-message-input" required minLength={10} maxLength={4000} rows={6}
                        className={`${inputCls} resize-y`} placeholder="What have you built, what broke, and what did you learn?"
                        value={form.message} onChange={set("message")} />
                    </div>
                    <button
                      type="submit"
                      data-testid="careers-submit-button"
                      disabled={sending}
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-slate-900 text-white font-semibold transition-all duration-200 hover:bg-electric disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {sending ? <Loader2 size={17} className="animate-spin" /> : <Mail size={16} />}
                      {sending ? "Submitting…" : "Submit application"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default Careers;
