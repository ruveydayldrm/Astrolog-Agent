"use client";

import { motion } from "framer-motion";

const WORDS = ["Gökyüzü", "seni", "hatırlıyor."];

/** Kelime kelime beliren hero başlığı. */
export function HeroTitle() {
  return (
    <h1 className="font-serif text-5xl font-medium leading-[1.05] text-silver-100 sm:text-7xl md:text-8xl">
      {WORDS.map((w, i) => (
        <motion.span
          key={w}
          className={i === 2 ? "gold-text inline-block italic" : "inline-block"}
          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.15 + i * 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {w}
          {i < WORDS.length - 1 && " "}
        </motion.span>
      ))}
    </h1>
  );
}
