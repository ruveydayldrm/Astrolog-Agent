"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useOptimistic, useState, useTransition } from "react";
import { TrashIcon } from "@/components/icons/AstroIcons";
import { Button, Notice } from "@/components/ui/primitives";
import type { MemoryRow } from "@/lib/db";
import { deleteMemory, resetMemory } from "./actions";

const GROUPS: { kind: MemoryRow["kind"]; title: string; hint: string }[] = [
  { kind: "fact", title: "Seninle ilgili bildiklerim", hint: "Sohbetlerimizden öğrendiğim kalıcı bilgiler." },
  { kind: "follow_up", title: "Takip ettiğim konular", hint: "Sana sonra sormayı düşündüğüm şeyler." },
  { kind: "reading", title: "Önceki yorumlarım", hint: "Tutarlı kalabilmek için hatırladığım yorumlar." },
];

export function MemoryManager({ memories }: { memories: MemoryRow[] }) {
  const [optimistic, removeOptimistic] = useOptimistic(memories, (state, id: string | "all") =>
    id === "all" ? [] : state.filter((m) => m.id !== id),
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const remove = (id: string) =>
    startTransition(async () => {
      setError(null);
      removeOptimistic(id);
      const res = await deleteMemory(id);
      if (!res.ok) setError(res.error);
    });

  const reset = () =>
    startTransition(async () => {
      setError(null);
      setConfirming(false);
      removeOptimistic("all");
      const res = await resetMemory();
      if (!res.ok) setError(res.error);
    });

  return (
    <div className="space-y-8">
      {error && <Notice>{error}</Notice>}
      {optimistic.length === 0 && (
        <Notice tone="info">Hafızam şu an boş. Sohbet ettikçe seni daha iyi tanıyacağım. ✨</Notice>
      )}

      {GROUPS.map((g) => {
        const items = optimistic.filter((m) => m.kind === g.kind);
        if (items.length === 0) return null;
        return (
          <section key={g.kind}>
            <h3 className="font-serif text-xl text-silver-100">{g.title}</h3>
            <p className="text-xs text-silver-500">{g.hint}</p>
            <ul className="mt-3 space-y-2">
              <AnimatePresence initial={false}>
                {items.map((m) => (
                  <motion.li
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 30, transition: { duration: 0.2 } }}
                    className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                    <span className="flex-1 text-silver-300">{m.content}</span>
                    <button
                      onClick={() => remove(m.id)}
                      disabled={pending}
                      aria-label="Bu bilgiyi unut"
                      title="Unut"
                      className="text-silver-500 transition hover:text-rose-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </section>
        );
      })}

      {optimistic.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-t border-white/5 pt-6">
          {confirming ? (
            <>
              <span className="text-sm text-silver-300">Tüm hafıza silinecek. Emin misin?</span>
              <Button variant="danger" onClick={reset} disabled={pending} className="py-2">
                Evet, sıfırla
              </Button>
              <Button variant="subtle" onClick={() => setConfirming(false)} className="py-2">
                Vazgeç
              </Button>
            </>
          ) : (
            <Button variant="danger" onClick={() => setConfirming(true)} className="py-2">
              Hafızayı tamamen sıfırla
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
