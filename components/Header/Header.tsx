import Link from "next/link";
import { Container } from "@/components/Container";
import { Nav } from "./Nav";
import { ScrollProgressLine } from "./ScrollProgressLine";

const FADE_MASK = {
  maskImage: "linear-gradient(to bottom, black, transparent)",
  WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
};

export function Header() {
  return (
    <header className="sticky top-0 z-50">
      <div
        aria-hidden="true"
        className="absolute inset-0 backdrop-blur-md"
        style={FADE_MASK}
      />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-bg"
      >
        Skip to content
      </a>
      <Container className="relative flex items-center gap-6 py-6">
        <Link
          href="/"
          className="shrink-0 font-sans text-sm font-bold text-white"
        >
          <span className="md:hidden">DM</span>
          <span className="hidden md:inline">Daine Mawer</span>
        </Link>
        <ScrollProgressLine />
        <Nav />
      </Container>
    </header>
  );
}
