"use client";

import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function LoginForm({ linkError }: { linkError: string | null }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [email, setEmail] = useState("");
  const [passkey, setPasskey] = useState<"idle" | "waiting" | "error">("idle");
  const router = useRouter();

  // The main way in. Email links still work until a passkey is added, and
  // after that only with ALLOW_EMAIL_SIGN_IN=1 (lib/auth.ts).
  async function signInWithPasskey() {
    setPasskey("waiting");
    const result = await authClient.signIn.passkey();
    if (result?.error) setPasskey("error");
    else router.replace("/");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL: "/",
      errorCallbackURL: "/login?error=link",
    });
    setState(error ? "error" : "sent");
  }

  if (state === "sent") {
    return (
      <output className="block rounded-lg border p-4 text-sm">
        If <strong className="font-medium">{email}</strong> can sign in, a link
        is on its way. It works once and expires in 15 minutes.
      </output>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Button
          type="button"
          onClick={signInWithPasskey}
          disabled={passkey === "waiting"}
        >
          <KeyRound aria-hidden="true" />
          {passkey === "waiting"
            ? "Waiting for your device…"
            : "Sign in with a passkey"}
        </Button>
        {passkey === "error" ? (
          <p className="text-sm text-destructive" role="alert">
            Passkey sign-in didn't finish. Try again, or use an email link.
          </p>
        ) : null}
      </div>
      <p className="flex items-center gap-3 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
        or
      </p>
      <form onSubmit={onSubmit} className="grid gap-4">
        {linkError ? (
          <p className="text-sm text-destructive" role="alert">
            That sign-in link has expired or was already used. Request a new
            one.
          </p>
        ) : null}
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <Button type="submit" variant="outline" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Email me a sign-in link"}
        </Button>
        {state === "error" ? (
          <p className="text-sm text-destructive" role="alert">
            Couldn't send right now. Wait a minute and try again.
          </p>
        ) : null}
      </form>
    </div>
  );
}
