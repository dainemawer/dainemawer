export function Hero() {
  return (
    <section className="px-6 py-24 md:px-12 md:py-32">
      <div className="flex items-center gap-4">
        <div
          aria-hidden="true"
          className="h-12 w-12 shrink-0 rounded-full bg-surface-2 ring-1 ring-border-1"
        />
        <p className="font-mono text-xs text-muted-2 sm:text-sm">
          I build and ship AI-powered products using Next.js, TypeScript,
          Supabase, Vercel, and Expo
        </p>
      </div>

      <h1 className="mt-8 max-w-4xl text-[40px] font-semibold leading-[1.1] tracking-[-1.5px] text-white sm:text-[56px] sm:tracking-[-2.5px] md:text-[80px] md:leading-[84px] md:tracking-[-4px]">
        Staff Engineer, <span className="text-white/50">Building with AI</span>
      </h1>

      <div className="mt-10 flex flex-col divide-y divide-border-1 font-mono text-xs uppercase tracking-widest text-muted-3 md:flex-row md:items-center md:divide-x md:divide-y-0">
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
