export function Hero() {
  return (
    <section className="mx-auto w-full max-w-[1200px] px-6 py-10 md:px-16 md:py-16">
      <div className="flex items-center gap-4">
        <div
          aria-hidden="true"
          className="h-9 w-9 shrink-0 rounded-full bg-surface-2 ring-1 ring-border-1 md:h-16 md:w-16"
        />
        <p className="max-w-[370px] font-mono text-xs text-muted-2 sm:text-sm">
          I build and ship AI-powered products using Next.js, TypeScript,
          Supabase, Vercel, and Expo
        </p>
      </div>

      <h1 className="mt-10 max-w-4xl text-[44px] font-semibold leading-[1.05] tracking-[-2.2px] text-white md:mt-24 md:text-[80px] md:leading-[84px] md:tracking-[-4px] min-[1440px]:text-[104px] min-[1440px]:leading-[109px] min-[1440px]:tracking-[-5.2px]">
        Staff Engineer, <span className="text-white/50">Building with AI</span>
      </h1>

      <div className="mt-6 flex flex-col gap-2 font-mono text-xs uppercase tracking-widest text-muted-3 md:mt-12 md:flex-row md:items-center md:gap-4">
        <span>Cape Town, South Africa</span>
        <span
          aria-hidden="true"
          className="h-px w-full bg-white/10 md:w-auto md:flex-1"
        />
        <span>GMT+2</span>
        <span
          aria-hidden="true"
          className="h-px w-full bg-white/10 md:w-auto md:flex-1"
        />
        <span className="flex items-center gap-2 text-accent">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-accent"
          />
          Available
        </span>
      </div>
    </section>
  );
}
