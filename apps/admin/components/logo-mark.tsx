import { LOGO_PATH_D, LOGO_VIEWBOX } from "@dm/ui/logo-mark";

export function LogoMark({ className = "h-4 w-auto" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox={LOGO_VIEWBOX}
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
