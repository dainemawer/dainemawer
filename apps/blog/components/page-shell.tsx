import type { ReactNode } from "react";
import { FooterElsewhere } from "./footer-elsewhere";
import { Logo } from "./logo";
import { UtilityBar } from "./utility-bar";

export function PageShell({
  sidebar,
  sidebarGap = "md:gap-23.5",
  children,
}: {
  sidebar: ReactNode;
  sidebarGap?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-shell grid-cols-1 gap-11 px-6 py-8 sm:px-10 md:grid-cols-shell md:gap-0 md:px-14 md:py-11">
        <div className={`flex h-full flex-col gap-8 ${sidebarGap}`}>
          <div className="flex items-center justify-between md:block">
            <Logo />
            {/* Same site-header transition name as the desktop header below —
                only one of the two is ever rendered (the other is
                display:none via md:hidden/hidden md:block), so there's no
                naming collision, and each breakpoint keeps the utility bar
                isolated from the default cross-fade/slide transition. */}
            <div
              className="md:hidden"
              style={{ viewTransitionName: "site-header" }}
            >
              <UtilityBar />
            </div>
          </div>
          {sidebar}
        </div>
        <div className="flex flex-col">
          <header
            className="hidden md:block"
            style={{ viewTransitionName: "site-header" }}
          >
            <UtilityBar />
          </header>
          <main id="content" className="mt-8.75 md:mt-17.5">
            {children}
          </main>
          <FooterElsewhere />
        </div>
      </div>
    </div>
  );
}
