import { Link } from "react-router-dom";
import { ArrowRight, FileText, Home, Info, Settings2, Briefcase, Layers, FolderGit2, Newspaper } from "lucide-react";
import { Card } from "@/admin/components";
import { can } from "@/admin/api";
import usePageMeta from "@/hooks/usePageMeta";

const ContentHome = () => {
  usePageMeta("Content", "Website content management — AUTRAXIS Control Center.");

  const sections = [
    { to: "/admin/content/home", icon: Home, title: "Homepage", desc: "Hero headline, supporting copy and CTA labels.", cap: "content:read" },
    { to: "/admin/content/about", icon: Info, title: "About page", desc: "Intro title and the operating-model paragraphs.", cap: "content:read" },
    { to: "/admin/collection/services", icon: Layers, title: "Services", desc: "The six service detail pages.", cap: "content:read" },
    { to: "/admin/collection/solutions", icon: FileText, title: "Solutions & use cases", desc: "Representative industry architectures.", cap: "content:read" },
    { to: "/admin/collection/projects", icon: FolderGit2, title: "Projects & blueprints", desc: "Demonstration blueprints and highlights.", cap: "content:read" },
    { to: "/admin/collection/insights", icon: Newspaper, title: "Insights articles", desc: "Long-form articles and metadata.", cap: "content:read" },
    { to: "/admin/collection/jobs", icon: Briefcase, title: "Job postings", desc: "Draft, publish, close and archive vacancies.", cap: "jobs:read" },
    { to: "/admin/settings", icon: Settings2, title: "Site settings", desc: "Brand, emails, socials, footer and SEO.", cap: "content:read" },
  ].filter((s) => can(s.cap));

  return (
    <div data-testid="admin-content-page">
      <h1 className="font-display text-2xl font-bold text-slate-900">Content</h1>
      <p className="text-sm text-slate-500 mt-1">
        Edit the public website without touching source code. Drafts stay private until published.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {sections.map((s) => (
          <Link key={s.to} to={s.to} data-testid={`content-link-${s.title.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
            <Card className="h-full hover:border-cyanglow transition-colors group">
              <s.icon size={20} className="text-electric" />
              <h2 className="font-display text-base font-semibold text-slate-900 mt-3 group-hover:text-electric transition-colors">{s.title}</h2>
              <p className="text-xs text-slate-500 mt-1">{s.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-electric">
                Open <ArrowRight size={12} />
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ContentHome;
