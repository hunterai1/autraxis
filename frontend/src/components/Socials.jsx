import { Facebook, Youtube, Instagram, Linkedin, Github } from "lucide-react";

// Placeholder profile URLs — swap these for the real AUTRAXIS pages when they exist.
export const SOCIALS = [
  { id: "facebook", label: "Facebook", href: "https://www.facebook.com/autraxis", Icon: Facebook },
  {
    id: "x",
    label: "X (Twitter)",
    href: "https://x.com/autraxis",
    path: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
  },
  { id: "youtube", label: "YouTube", href: "https://www.youtube.com/@autraxis", Icon: Youtube },
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/autraxis", Icon: Instagram },
  { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/company/autraxis", Icon: Linkedin },
  {
    id: "xing",
    label: "Xing",
    href: "https://www.xing.com/pages/autraxis",
    path: "M18.188 0c-.517 0-.741.325-.927.66 0 0-7.455 13.224-7.702 13.657.015.024 4.919 9.023 4.919 9.023.17.308.436.66.967.66h3.454c.211 0 .375-.078.463-.22.089-.151.089-.346-.009-.536l-4.879-8.916c-.004-.006-.004-.016 0-.022L22.139.756c.095-.191.097-.387.006-.535C22.056.078 21.894 0 21.686 0h-3.498zM3.648 4.74c-.211 0-.385.074-.473.216-.09.149-.078.339.02.531l2.34 4.05c.004.01.004.016 0 .021L1.86 16.051c-.099.188-.093.381 0 .529.085.142.239.234.45.234h3.461c.518 0 .766-.348.945-.667l3.734-6.609-2.378-4.155c-.172-.315-.434-.659-.962-.659H3.648v.016z",
  },
  { id: "github", label: "GitHub", href: "https://github.com/autraxis", Icon: Github },
];

const Socials = () => (
  <div className="flex flex-wrap gap-3" data-testid="social-links">
    {SOCIALS.map(({ id, label, href, Icon, path }) => (
      <a
        key={id}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`AUTRAXIS on ${label}`}
        data-testid={`social-${id}-link`}
        className="w-11 h-11 rounded-full border border-cyan-500/25 text-mist inline-flex items-center justify-center transition-all duration-200 hover:text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/10 hover:shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:-translate-y-0.5"
      >
        {Icon ? (
          <Icon size={18} />
        ) : (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d={path} />
          </svg>
        )}
      </a>
    ))}
  </div>
);

export default Socials;
