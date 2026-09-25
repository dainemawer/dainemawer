import { auth } from "@/lib/auth/server";

export default async function DashboardPage() {
  const { data: session } = await auth.getSession();

  return (
    <main style={{ padding: "3rem", color: "#111111", background: "#ffffff" }}>
      <h1>Overview</h1>
      <p style={{ color: "#6b6b6b" }}>
        Signed in as {session?.user?.email ?? "unknown"}.
      </p>
    </main>
  );
}
