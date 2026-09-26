import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-12">
      <div className="max-w-sm text-center">
        <h1 className="text-2xl text-ink">Client Portal</h1>
        <p className="mt-2 text-md text-muted">
          <Link href="/auth/sign-in" className="text-ink underline">
            Sign in
          </Link>{" "}
          to see your project.
        </p>
      </div>
    </main>
  );
}
