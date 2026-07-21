import Link from "next/link";
import { Container } from "@/components/Container";
import { CTAButton } from "./CTAButton";
import { GitHubIcon, LinkedInIcon } from "./icons";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="bg-bg">
      <Container className="py-16 md:py-24">
        <h2 className="max-w-2xl text-4xl font-semibold text-white md:text-5xl">
          Let’s Connect
        </h2>
        <p className="mt-4 max-w-md font-sans text-muted-2">
          Feel free to contact me if having any questions. I’m available for new
          projects or just for chatting.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <CTAButton href="https://cal.com">Book a Call</CTAButton>
          <CTAButton href="mailto:hello@dainemawer.com" external={false}>
            Send an Email
          </CTAButton>
          <CTAButton href="https://linkedin.com">Follow on LinkedIn</CTAButton>
        </div>

        <div className="mt-16 flex flex-col gap-6 border-t border-border-1 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="font-mono text-xs text-muted-3">Daine Mawer, {year}</p>
          <div className="-mx-2 flex items-center gap-3">
            <Link
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="rounded p-2 text-muted-3 transition-colors hover:text-white"
            >
              <LinkedInIcon />
            </Link>
            <Link
              href="https://github.com/dainemawer"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="rounded p-2 text-muted-3 transition-colors hover:text-white"
            >
              <GitHubIcon />
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
