"use client";

import { useEffect, useRef } from "react";

/**
 * Fixed bar at the top of the viewport that fills left-to-right as the
 * reader scrolls through the article. Driven by a rAF-throttled scroll
 * listener rather than a CSS transition, so the fill always matches the
 * user's own scroll position 1:1 with no added motion to gate behind
 * prefers-reduced-motion.
 */
export function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      ticking = false;
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      const bar = barRef.current;
      if (bar) {
        bar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-50 h-1.5 bg-transparent"
    >
      <div
        ref={barRef}
        className="h-full origin-left bg-ink"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
