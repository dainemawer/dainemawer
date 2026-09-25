export default function HomePage() {
  return (
    <main style={{ padding: "3rem", color: "#111111", background: "#ffffff" }}>
      <h1>Client Portal</h1>
      <p style={{ color: "#6b6b6b" }}>
        <a href="/auth/sign-in" style={{ color: "#111111" }}>
          Sign in
        </a>{" "}
        to see your project.
      </p>
    </main>
  );
}
