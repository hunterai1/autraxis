import { Link } from "react-router-dom";
import { Mail, Globe } from "lucide-react";
import Logo from "@/components/Logo";
import { services } from "@/data/content";

const Footer = () => (
  <footer data-testid="site-footer" className="bg-abyss border-t border-cyan-500/15">
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 lg:py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4">
          <Logo />
          <p className="mt-6 text-sm leading-relaxed text-mist max-w-xs">
            A remote-first enterprise integration and AI technology practice.
            We connect the systems your business already runs on — and make the data between them work harder.
          </p>
          <div className="mt-8 inline-block rounded-2xl bg-white px-5 py-4" data-testid="footer-full-logo-card">
            <img
              src="/brand/logo-full-transparent.png"
              alt="AUTRAXIS Systems Inc. — full logo"
              className="h-12 w-auto"
              loading="lazy"
              data-testid="footer-full-logo"
            />
          </div>
        </div>

        <nav aria-label="Footer" className="lg:col-span-2">
          <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-cyanglow mb-5">Explore</h3>
          <ul className="space-y-3 text-sm">
            {[
              ["Services", "/services", "footer-services-link"],
              ["Solutions", "/solutions", "footer-solutions-link"],
              ["Projects", "/projects", "footer-projects-link"],
              ["Insights", "/insights", "footer-insights-link"],
              ["About", "/about", "footer-about-link"],
              ["Careers", "/careers", "footer-careers-link"],
            ].map(([label, to, id]) => (
              <li key={id}>
                <Link to={to} data-testid={id} className="text-mist hover:text-cyan-300 transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-3">
          <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-cyanglow mb-5">Capabilities</h3>
          <ul className="space-y-3 text-sm">
            {services.map((s) => (
              <li key={s.slug}>
                <Link
                  to={`/services/${s.slug}`}
                  data-testid={`footer-service-${s.slug}-link`}
                  className="text-mist hover:text-cyan-300 transition-colors"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-cyanglow mb-5">Contact</h3>
          <ul className="space-y-4 text-sm">
            <li>
              <a
                href="mailto:info@autraxis.com"
                data-testid="footer-info-email-link"
                className="inline-flex items-center gap-2 text-mist hover:text-cyan-300 transition-colors"
              >
                <Mail size={14} className="text-cyanglow" /> info@autraxis.com
              </a>
            </li>
            <li>
              <a
                href="mailto:careers@autraxis.com"
                data-testid="footer-careers-email-link"
                className="inline-flex items-center gap-2 text-mist hover:text-cyan-300 transition-colors"
              >
                <Mail size={14} className="text-cyanglow" /> careers@autraxis.com
              </a>
            </li>
            <li className="inline-flex items-center gap-2 text-mist">
              <Globe size={14} className="text-cyanglow" /> Remote-first — working across time zones
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-14 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-xs text-slate-500">© {new Date().getFullYear()} AUTRAXIS Systems Inc. All rights reserved.</p>
        <div className="flex items-center gap-6 text-xs">
          <Link to="/privacy" data-testid="footer-privacy-link" className="text-slate-500 hover:text-cyan-300 transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms" data-testid="footer-terms-link" className="text-slate-500 hover:text-cyan-300 transition-colors">
            Terms of Use
          </Link>
          <Link to="/admin" data-testid="footer-admin-link" className="text-slate-600 hover:text-cyan-300 transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
