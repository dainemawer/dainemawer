"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

export function ParallaxPortrait() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-30, 30]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="relative aspect-[432/526] w-full overflow-hidden bg-surface-2 ring-1 ring-border-1"
    >
      <motion.div
        style={{ y }}
        className="absolute inset-x-0 inset-y-[-30px] bg-surface-2"
      />
    </div>
  );
}
