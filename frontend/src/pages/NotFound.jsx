import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import usePageMeta from "@/hooks/usePageMeta";

const NotFound = () => {
  usePageMeta("Page not found", "The page you requested could not be found.");
  return (
    <div data-testid="not-found-page" className="relative bg-abyss min-h-[80vh] pt-[72px] flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-grid-dark opacity-50" aria-hidden="true" />
      <div className="relative max-w-3xl mx-auto px-5 sm:px-8 py-24 text-center">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-cyanglow">Error 404</p>
          <h1 className="mt-5 font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-frost">
            This route isn't integrated.
          </h1>
          <p className="mt-5 text-mist leading-relaxed">
            The page you're looking for doesn't exist — or the mapping failed. Either way, the way back is simple.
          </p>
          <Link
            to="/"
            data-testid="not-found-home-link"
            className="mt-9 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-electric text-white font-semibold transition-all duration-200 hover:bg-cyanglow hover:text-abyss"
          >
            <ArrowLeft size={16} /> Back to home
          </Link>
        </Reveal>
      </div>
    </div>
  );
};

export default NotFound;
