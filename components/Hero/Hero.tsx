export function Hero() {
  return (
    <section className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col justify-between px-6 py-10 md:px-16 md:py-16">
      <div className="flex items-center gap-4">
        <div
          aria-hidden="true"
          className="h-9 w-9 shrink-0 rounded-full bg-surface-2 ring-1 ring-border-1 md:h-16 md:w-16"
        />
        <p className="font-mono text-xs text-muted-2 sm:text-sm">
          I build and ship AI-powered products using Next.js, TypeScript,
          Supabase, Vercel, and Expo
        </p>
      </div>

      <h1 className="max-w-4xl text-[44px] font-semibold leading-[1.05] tracking-[-2.2px] text-white md:text-[80px] md:leading-[84px] md:tracking-[-4px] min-[1440px]:text-[104px] min-[1440px]:leading-[109px] min-[1440px]:tracking-[-5.2px]">
        Staff Engineer, <span className="text-white/50">Building with AI</span>
      </h1>

      <div className="flex flex-col divide-y divide-border-1 font-mono text-xs uppercase tracking-widest text-muted-3 md:flex-row md:items-center md:divide-x md:divide-y-0">
        <span className="py-2 md:py-0 md:pr-4">Cape Town, South Africa</span>
        <span className="py-2 md:px-4">GMT+2</span>
        <span className="flex items-center gap-2 py-2 text-accent md:pl-4">
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
