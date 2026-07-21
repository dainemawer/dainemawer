"use client";

import { motion, useScroll } from "motion/react";

export function ScrollProgressLine() {
  const { scrollYProgress } = useScroll();

  return (
    <span
      aria-hidden="true"
      className="relative h-px flex-1 overflow-hidden bg-border-1"
    >
      <motion.span
        style={{ scaleX: scrollYProgress }}
        className="absolute inset-0 origin-left bg-white/50"
      />
    </span>
  );
}
