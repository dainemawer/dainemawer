import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRightIcon } from "@/components/About/ArrowUpRightIcon";

interface CTAButtonProps {
  href: string;
  children: ReactNode;
  external?: boolean;
}

export function CTAButton({ href, children, external = true }: CTAButtonProps) {
  return (
    <Link
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 font-sans text-sm uppercase text-white transition-colors hover:bg-white/10"
    >
      {children}
      <ArrowUpRightIcon />
    </Link>
  );
}
