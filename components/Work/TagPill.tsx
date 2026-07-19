export function TagPill({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-white/25 px-4 py-1 font-mono text-sm text-white/50">
      {children}
    </span>
  );
}
