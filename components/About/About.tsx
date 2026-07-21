import Link from "next/link";
import { Container } from "@/components/Container";
import { ArrowUpRightIcon } from "./ArrowUpRightIcon";
import { BioText } from "./BioText";
import { ParallaxPortrait } from "./ParallaxPortrait";

export function About() {
  return (
    <section id="about" aria-labelledby="about-heading">
      <Container className="pt-16 pb-16 md:pt-14 md:pb-24">
        <h2 id="about-heading" className="sr-only">
          About
        </h2>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-6">
          <div className="flex flex-col justify-between gap-16">
            <BioText />
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
          <ParallaxPortrait />
        </div>
      </Container>
    </section>
  );
}
