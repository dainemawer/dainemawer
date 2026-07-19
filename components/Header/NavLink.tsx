import Link from "next/link";

interface NavLinkProps {
  href: string;
  children: string;
}

export function NavLink({ href, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      className="group relative block px-3 py-1.5 font-sans text-sm text-white/75 transition-colors hover:text-white"
    >
      <span className="relative block h-[1lh] overflow-hidden">
        <span className="flex flex-col transition-transform duration-300 ease-out group-hover:-translate-y-[1lh]">
          <span>{children}</span>
          <span aria-hidden="true">{children}</span>
          <span aria-hidden="true">{children}</span>
        </span>
      </span>
    </Link>
  );
}
