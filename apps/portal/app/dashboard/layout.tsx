import type { ReactNode } from "react";
import { NavLink } from "@/components/nav-link";
import { SignOutButton } from "@/components/sign-out-button";
import { getCurrentUserContext } from "@/lib/data/current-user";
import { colors } from "@/lib/tokens";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { email } = await getCurrentUserContext();

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100dvh",
        background: colors.surface,
      }}
    >
      <aside
        style={{
          width: "13rem",
          flexShrink: 0,
          padding: "2rem 1.5rem",
          borderRight: `1px solid ${colors.divider}`,
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
        }}
      >
        <strong style={{ color: colors.ink }}>D-M</strong>
        <nav
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <NavLink href="/dashboard">Overview</NavLink>
          <NavLink href="/dashboard/change-requests">Change requests</NavLink>
          <NavLink href="/dashboard/bug-reports">Bug reports</NavLink>
          <NavLink href="/dashboard/timeline">Timeline</NavLink>
        </nav>
        <div
          style={{
            marginTop: "auto",
            fontSize: "0.84375rem",
            color: colors.faint,
          }}
        >
          <p style={{ margin: "0 0 0.5rem" }}>{email}</p>
          <SignOutButton />
        </div>
      </aside>
      <main style={{ flex: 1, padding: "3rem" }}>{children}</main>
    </div>
  );
}
