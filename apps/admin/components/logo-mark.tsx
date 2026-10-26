import { LOGO_PATH_D, LOGO_VIEWBOX } from "@dm/ui/logo-mark";

/** `initial` crops the wordmark to its "d", for the collapsed sidebar. */
export function LogoMark({
  className = "h-4 w-auto",
  initial = false,
}: {
  className?: string;
  initial?: boolean;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox={initial ? "0 0 25 37" : LOGO_VIEWBOX}
      className={className}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        stroke="currentColor"
        strokeWidth=".5"
        d={LOGO_PATH_D}
      />
    </svg>
  );
}
