"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { signOutOtherSessions } from "@/lib/actions/security";
import { authClient } from "@/lib/auth-client";
import { describeDevice } from "@/lib/user-agent";

/** Runs a passkey call or action, toasts its error, and re-reads the page. */
function useSecurityAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (
    action: () => Promise<{ error?: { message?: string } | string | null }>,
    success: string,
  ) =>
    startTransition(async () => {
      const result = await action();
      const error =
        typeof result?.error === "string"
          ? result.error
          : result?.error
            ? (result.error.message ?? "That didn't work.")
            : null;
      if (error) toast.error(error);
      else {
        toast.success(success);
        router.refresh();
      }
    });
  return [pending, run] as const;
}

export function AddPasskeyButton({ first }: { first: boolean }) {
  const [pending, run] = useSecurityAction();
  return (
    <Button
      variant={first ? "default" : "outline"}
      disabled={pending}
      onClick={() =>
        run(
          () =>
            authClient.passkey.addPasskey({
              name: describeDevice(navigator.userAgent),
            }),
          first ? "Passkey added. Email links are now off." : "Passkey added.",
        )
      }
    >
      {pending ? "Waiting for your device…" : "Add a passkey"}
    </Button>
  );
}

export function RemovePasskeyButton({
  id,
  last,
}: {
  id: string;
  last: boolean;
}) {
  const [pending, run] = useSecurityAction();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (
          last &&
          !window.confirm(
            "Remove your last passkey? Email sign-in links come back on.",
          )
        ) {
          return;
        }
        run(() => authClient.passkey.deletePasskey({ id }), "Passkey removed.");
      }}
    >
      Remove
    </Button>
  );
}

export function SignOutOthersButton() {
  const [pending, run] = useSecurityAction();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() => run(signOutOtherSessions, "Other sessions signed out.")}
    >
      {pending ? "Signing out…" : "Sign out other sessions"}
    </Button>
  );
}
