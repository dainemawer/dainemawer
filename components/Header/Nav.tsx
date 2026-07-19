import { NavLink } from "./NavLink";

const PRIMARY_LINKS = [
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Blog", href: "/blog" },
];

const CONTACT_LINK = { label: "Contact", href: "#contact" };

export function Nav() {
  return (
    <nav className="flex items-center">
      <div className="hidden items-center md:flex">
        {PRIMARY_LINKS.map((link) => (
          <NavLink key={link.href} href={link.href}>
            {link.label}
          </NavLink>
        ))}
      </div>
      <NavLink href={CONTACT_LINK.href}>{CONTACT_LINK.label}</NavLink>
    </nav>
  );
}
