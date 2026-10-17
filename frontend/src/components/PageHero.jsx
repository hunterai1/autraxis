import { Reveal, Eyebrow } from "@/components/Reveal";

const PageHero = ({ eyebrow, title, description, testId }) => (
  <section data-testid={testId} className="relative bg-abyss pt-[72px] overflow-hidden">
    <div className="absolute inset-0 bg-grid-dark opacity-60" aria-hidden="true" />
    <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[380px] rounded-full bg-electric/20 blur-[140px]" aria-hidden="true" />
    <div className="relative max-w-7xl mx-auto px-5 sm:px-8 py-20 lg:py-28">
      <Reveal>
        <Eyebrow dark>{eyebrow}</Eyebrow>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-frost max-w-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-6 text-base sm:text-lg leading-relaxed text-mist max-w-2xl">{description}</p>
        )}
      </Reveal>
    </div>
  </section>
);

export default PageHero;
