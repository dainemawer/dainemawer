"use client";

import { motion } from "motion/react";
import { useRef, useState } from "react";
import { NavLink } from "./NavLink";

const PRIMARY_LINKS = [
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Blog", href: "/blog" },
];

const CONTACT_LINK = { label: "Contact", href: "#contact" };

interface PillRect {
  left: number;
  width: number;
}

export function Nav() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<PillRect | null>(null);

  function handleEnter(event: React.MouseEvent<HTMLAnchorElement>) {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    const linkRect = event.currentTarget.getBoundingClientRect();
    setPill({
      left: linkRect.left - containerRect.left,
      width: linkRect.width,
    });
  }

  return (
    <nav
      ref={containerRef}
      onMouseLeave={() => setPill(null)}
      className="relative flex items-center"
    >
      {pill ? (
        <motion.div
          className="absolute inset-y-0 rounded-full bg-white/10"
          initial={false}
          animate={{ left: pill.left, width: pill.width }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
        />
      ) : null}
      <div className="hidden items-center md:flex">
        {PRIMARY_LINKS.map((link) => (
          <NavLink key={link.href} href={link.href} onMouseEnter={handleEnter}>
            {link.label}
          </NavLink>
        ))}
      </div>
      <NavLink href={CONTACT_LINK.href} onMouseEnter={handleEnter}>
        {CONTACT_LINK.label}
      </NavLink>
    </nav>
  );
}
