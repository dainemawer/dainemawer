"use client";

import { motion } from "motion/react";

const BIO_WORDS =
  "I’m a full-stack engineer who ships AI-powered products fast — architecting backend systems, integrating models, and building polished UIs without waiting on a team. Next.js, TypeScript, Supabase, Vercel. I turn ambiguous ideas into production software in days, not months.".split(
    " ",
  );

export function BioText() {
  return (
    <p className="max-w-[450px] font-sans text-xl leading-[1.4] font-semibold tracking-[-0.04em] text-white min-[1440px]:text-2xl">
      {BIO_WORDS.map((word, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: word list is static and never reorders
        <span key={index}>
          <motion.span
            initial={{ opacity: 0.2 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.4, delay: index * 0.015 }}
            className="inline-block"
          >
            {word}
          </motion.span>{" "}
        </span>
      ))}
    </p>
  );
}
