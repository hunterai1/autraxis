import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import Socials from "@/components/Socials";
import { useContent } from "@/content/ContentContext";

const Footer = () => {
  const c = useContent();
  const settings = c?.settings || {};
  const year = new Date().getFullYear();
  const copyright = (settings.copyright || "© {year} AUTRAXIS Systems Inc. All rights reserved.").replace("{year}", year);
  const footerText = settings.footer_text || "Intelligence. Integrated. — enterprise integration & AI technology, remote-first.";

  return (
    <footer data-testid="site-footer" className="bg-abyss border-t border-cyan-500/15">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 lg:py-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div>
            <Logo />
            <p className="mt-4 text-sm text-mist max-w-xs">{footerText}</p>
          </div>
          <div className="md:text-right">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-cyanglow mb-5">Connect with us</p>
            <div className="md:flex md:justify-end">
              <Socials items={c?.socials} />
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-slate-500" data-testid="footer-copyright">{copyright}</p>
          <div className="flex items-center gap-6 text-xs">
            <Link to="/privacy" data-testid="footer-privacy-link" className="text-slate-500 hover:text-cyan-300 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" data-testid="footer-terms-link" className="text-slate-500 hover:text-cyan-300 transition-colors">
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
