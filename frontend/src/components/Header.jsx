import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight } from "lucide-react";
import Logo from "@/components/Logo";
import { useContent } from "@/content/ContentContext";

const NAV = [
  { label: "Services", to: "/services", id: "services" },
  { label: "Solutions", to: "/solutions", id: "solutions" },
  { label: "Projects", to: "/projects", id: "projects" },
  { label: "Insights", to: "/insights", id: "insights" },
  { label: "About", to: "/about", id: "about" },
  { label: "Careers", to: "/careers", id: "careers" },
];

const Header = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const c = useContent();
  const ctaText = c?.settings?.cta_text || "{ctaText}";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (to) => pathname === to || pathname.startsWith(to + "/");

  return (
    <header
      data-testid="site-header"
      className="fixed top-0 inset-x-0 z-50 bg-abyss/90 backdrop-blur-md border-b border-cyan-500/20"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-[72px] flex items-center justify-between">
        <Link to="/" aria-label="AUTRAXIS home" data-testid="nav-home-link" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden lg:flex items-center gap-1" data-testid="primary-nav">
          {NAV.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              data-testid={`nav-${item.id}-link`}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                isActive(item.to)
                  ? "text-cyanglow bg-cyan-500/10"
                  : "text-mist hover:text-cyan-300 hover:bg-cyan-500/10"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/contact"
            data-testid="nav-contact-cta"
            className="ml-3 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-electric text-white text-sm font-semibold transition-all duration-200 hover:bg-cyanglow hover:text-abyss hover:shadow-[0_0_24px_rgba(6,182,212,0.45)]"
          >
            {ctaText}
            <ArrowUpRight size={15} />
          </Link>
        </nav>

        <button
          type="button"
          data-testid="mobile-menu-toggle"
          aria-expanded={open}
          aria-controls="mobile-nav-panel"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-full border border-cyan-500/30 text-frost hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-nav-panel"
            aria-label="Mobile"
            data-testid="mobile-nav-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden overflow-hidden border-t border-cyan-500/15 bg-abyss/95 backdrop-blur-md"
          >
            <div className="px-5 py-6 flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.id}
                  to={item.to}
                  data-testid={`mobile-nav-${item.id}-link`}
                  className={`px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    isActive(item.to)
                      ? "text-cyanglow bg-cyan-500/10"
                      : "text-frost hover:text-cyan-300 hover:bg-cyan-500/10"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/contact"
                data-testid="mobile-nav-contact-cta"
                className="mt-3 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-electric text-white font-semibold hover:bg-cyanglow hover:text-abyss transition-colors"
              >
                {ctaText}
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
