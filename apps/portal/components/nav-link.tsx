"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { colors } from "@/lib/tokens";

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      style={{
        color: active ? colors.ink : colors.faint,
        fontWeight: active ? 600 : 400,
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}
