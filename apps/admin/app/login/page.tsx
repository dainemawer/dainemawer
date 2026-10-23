import type { Metadata } from "next";
import { LogoMark } from "@/components/logo-mark";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <LogoMark className="mb-10 h-5 w-auto text-ink" />
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="mt-2 mb-8 text-sm text-muted-foreground">
          Quotes, invoices and customers. Sign in with a link sent to your
          email.
        </p>
        <LoginForm linkError={error ? String(error) : null} />
      </div>
    </main>
  );
}
