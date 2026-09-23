"use client";

import { useEffect, useState } from "react";

type TocItem = {
  id: string;
  label: string;
};

export function Toc({
  heading,
  ariaLabel,
  items,
  sticky = false,
}: {
  heading: string;
  ariaLabel: string;
  items: TocItem[];
  sticky?: boolean;
}) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-10% 0px -70% 0px" },
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label={ariaLabel}
      className={`hidden flex-col gap-3.5 md:flex md:pr-10 ${sticky ? "md:sticky md:top-10 md:self-start" : ""}`}
    >
      <div className="mb-1 text-faint text-xs">{heading}</div>
      <ul className="flex flex-col gap-3.5">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? "location" : undefined}
              className={`text-sm text-pretty transition-colors duration-140 ease-out hover:text-ink focus-visible:text-ink ${active === item.id ? "text-ink" : "text-muted"}`}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
