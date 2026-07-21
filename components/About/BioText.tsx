"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const BIO_WORDS =
  "I’m a full-stack engineer who ships AI-powered products fast — architecting backend systems, integrating models, and building polished UIs without waiting on a team. Next.js, TypeScript, Supabase, Vercel. I turn ambiguous ideas into production software in days, not months.".split(
    " ",
  );

interface RevealWordProps {
  word: string;
  range: [number, number];
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}

function RevealWord({ word, range, progress }: RevealWordProps) {
  const opacity = useTransform(progress, range, [0.2, 1]);
  return (
    <span>
      <motion.span style={{ opacity }} className="inline-block">
        {word}
      </motion.span>{" "}
    </span>
  );
}

export function BioText() {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.75", "start 0.35"],
  });
  const total = BIO_WORDS.length;

  return (
    <p
      ref={ref}
      className="max-w-[450px] font-sans text-xl leading-[1.4] font-semibold tracking-[-0.04em] text-white min-[1440px]:text-2xl"
    >
      {BIO_WORDS.map((word, index) => (
        <RevealWord
          // biome-ignore lint/suspicious/noArrayIndexKey: word list is static and never reorders
          key={index}
          word={word}
          range={[index / total, (index + 1) / total]}
          progress={scrollYProgress}
        />
      ))}
    </p>
  );
}
