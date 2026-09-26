"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

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
      className="border-0 bg-transparent p-0 text-faint text-inherit underline"
    >
      Sign out
    </button>
  );
}
