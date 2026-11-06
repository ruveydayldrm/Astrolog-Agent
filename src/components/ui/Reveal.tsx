"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

/** Görünür olduğunda yumuşakça belirip yukarı kayan sarmalayıcı. */
export function Reveal({ delay = 0, ...props }: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    />
  );
}
