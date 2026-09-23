import Link from "next/link";
import { LOGO_PATH_D, LOGO_VIEWBOX } from "@/lib/logo-mark";
import { site } from "@/lib/site";

export function Logo() {
  return (
    <Link
      href="/"
      aria-label={site.name}
      transitionTypes={["nav-back"]}
      style={{ viewTransitionName: "site-logo" }}
      className="block text-ink transition-opacity duration-140 ease-out hover:opacity-60 focus-visible:opacity-60"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox={LOGO_VIEWBOX}
        className="h-5 w-auto"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          stroke="currentColor"
          strokeWidth=".5"
          d={LOGO_PATH_D}
        />
      </svg>
    </Link>
  );
}
