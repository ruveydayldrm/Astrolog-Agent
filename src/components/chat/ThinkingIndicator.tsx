"use client";

import { motion } from "framer-motion";
import { SparkleIcon } from "@/components/icons/AstroIcons";

/** Lyra yazmaya başlamadan önce parıldayan "düşünüyor" göstergesi. */
export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-3 py-1" role="status" aria-live="polite">
      <motion.span
        className="text-gold-400"
        animate={{ rotate: [0, 180, 360], scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <SparkleIcon className="h-4 w-4" />
      </motion.span>
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-gold-300"
            animate={{ opacity: [0.2, 1, 0.2], y: [0, -3, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </span>
      <span className="shimmer-text text-sm">Lyra yıldızlara bakıyor…</span>
    </div>
  );
}
