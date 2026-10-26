"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="mt-1 flex items-center underline-offset-4 hover:text-ink hover:underline md:sidebar-collapsed:size-9 md:sidebar-collapsed:justify-center md:sidebar-collapsed:rounded-md md:sidebar-collapsed:hover:bg-accent"
      onClick={async () => {
        await authClient.signOut();
        router.push("/login");
      }}
    >
      {/* Icon only in the collapsed sidebar; the label stays for screen readers. */}
      <LogOut
        aria-hidden="true"
        className="hidden size-4 md:sidebar-collapsed:block"
      />
      <span className="md:sidebar-collapsed:sr-only">Sign out</span>
    </button>
  );
}
