import type { Metadata } from "next";
import { Suspense } from "react";
import { LogoMark } from "@/components/logo-mark";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

// Fully static apart from ?error= (an expired or used link), which is the
// only thing that waits for the request.
export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <LogoMark className="mb-10 h-5 w-auto text-ink" />
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="mt-2 mb-8 text-sm text-muted-foreground">
          Quotes, invoices, customers and expenses. Sign in with your passkey,
          or a link sent to your email.
        </p>
        <Suspense fallback={<LoginForm linkError={null} />}>
          <Form searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function Form({
  searchParams,
}: Pick<PageProps<"/login">, "searchParams">) {
  const { error } = await searchParams;
  return <LoginForm linkError={error ? String(error) : null} />;
}
