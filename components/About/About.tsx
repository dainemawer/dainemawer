import Link from "next/link";
import { Container } from "@/components/Container";
import { ArrowUpRightIcon } from "./ArrowUpRightIcon";

export function About() {
  return (
    <section id="about" aria-labelledby="about-heading">
      <Container className="py-16 md:py-24">
        <h2 id="about-heading" className="sr-only">
          About
        </h2>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-6">
          <div className="flex flex-col justify-between gap-16">
            <p className="max-w-xl text-xl text-white">
              I’m a full-stack engineer who ships AI-powered products fast —
              architecting backend systems, integrating models, and building
              polished UIs without waiting on a team. Next.js, TypeScript,
              Supabase, Vercel. I turn ambiguous ideas into production software
              in days, not months.
            </p>
            <div className="-mx-2 flex items-center gap-6 font-sans text-base text-white">
              <Link
                href="https://cal.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded px-2 py-2 hover:underline"
              >
                Book a call
                <ArrowUpRightIcon />
              </Link>
              <Link
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded px-2 py-2 hover:underline"
              >
                LinkedIn
                <ArrowUpRightIcon />
              </Link>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="aspect-[432/526] w-full bg-surface-2 ring-1 ring-border-1"
          />
        </div>
      </Container>
    </section>
  );
}
