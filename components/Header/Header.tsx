import Link from "next/link";
import { Container } from "@/components/Container";
import { Nav } from "./Nav";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-bg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-bg"
      >
        Skip to content
      </a>
      <Container className="flex items-center gap-6 py-6">
        <Link
          href="/"
          className="shrink-0 font-sans text-sm font-bold text-white"
        >
          <span className="md:hidden">DM</span>
          <span className="hidden md:inline">Daine Mawer</span>
        </Link>
        <span aria-hidden="true" className="h-px flex-1 bg-border-1" />
        <Nav />
      </Container>
    </header>
  );
}
