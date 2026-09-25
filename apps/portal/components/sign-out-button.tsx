"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { colors } from "@/lib/tokens";

export function SignOutButton() {
  const router = useRouter();

  async function handleClick() {
    await authClient.signOut();
    router.push("/auth/sign-in");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        color: colors.faint,
        cursor: "pointer",
        textDecoration: "underline",
        fontSize: "inherit",
      }}
    >
      Sign out
    </button>
  );
}
