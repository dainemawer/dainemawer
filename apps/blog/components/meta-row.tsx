import type { ReactNode } from "react";

export function MetaRow({
  id,
  label,
  headingLevel: Heading = "h2",
  children,
}: {
  id?: string;
  label: ReactNode;
  headingLevel?: "h2" | "h3";
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      className="grid grid-cols-1 gap-x-12 gap-y-1.5 scroll-mt-10 sm:grid-cols-meta sm:items-start sm:gap-y-0"
    >
      <Heading className="text-sm text-faint leading-normal font-normal sm:text-right">
        {label}
      </Heading>
      <div>{children}</div>
    </div>
  );
}
