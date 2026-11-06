"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PlanetIcon, SparkleIcon } from "@/components/icons/AstroIcons";
import { Button, Eyebrow } from "@/components/ui/primitives";
import { ASPECTS, type PlanetKey } from "@/lib/astro/constants";
import type { DailyNote } from "@/lib/lyra/daily";

const SYMBOL = Object.fromEntries(ASPECTS.map((a) => [a.key, a.symbol]));
const HARMONIOUS = new Set(["trine", "sextile"]);

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: DailyNote };

/** Günlük özet kartı: öne çıkan transitler + Lyra'nın notu. */
export function DailyCard({ todayLabel }: { todayLabel: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/daily")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);
        if (!cancelled) setState({ status: "ready", data: json });
      })
      .catch((e: Error) => !cancelled && setState({ status: "error", message: e.message || "Günlük notun şu an hazırlanamadı." }));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return (
    <div className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8">
      <div aria-hidden className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold-500/10 blur-3xl" />
      <Eyebrow>Bugünün gökyüzü · {todayLabel}</Eyebrow>

      {state.status === "loading" && (
        <div className="mt-6 space-y-3" aria-busy>
          <p className="shimmer-text font-serif text-xl">Lyra bugünün notunu yazıyor…</p>
          {[90, 75, 60].map((w) => (
            <div key={w} className="h-3 animate-pulse rounded-full bg-white/5" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {state.status === "error" && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-silver-300">{state.message}</p>
          <Button
            variant="ghost"
            className="py-2"
            onClick={() => {
              setState({ status: "loading" });
              setAttempt((a) => a + 1);
            }}
          >
            Tekrar dene
          </Button>
        </div>
      )}

      {state.status === "ready" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          <div className="mt-5 flex gap-3">
            <SparkleIcon className="mt-1 h-5 w-5 shrink-0 text-gold-400" />
            <p className="font-serif text-xl leading-relaxed text-silver-100 sm:text-2xl">{state.data.note}</p>
          </div>

          {state.data.transits.length > 0 && (
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {state.data.transits.map((t, i) => (
                <motion.li
                  key={t.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="flex items-center gap-3 rounded-2xl border border-white/5 bg-night-900/40 px-4 py-3"
                >
                  <PlanetIcon planet={t.a as PlanetKey} className="h-5 w-5 text-gold-400" />
                  <span className={HARMONIOUS.has(t.type) ? "text-lilac-300" : "text-rose-400"}>{SYMBOL[t.type]}</span>
                  <span className="flex-1 text-sm text-silver-300">{t.label.replace(/ \(orb.*$/, "")}</span>
                  <span className="text-[11px] text-silver-500">{t.orb.toFixed(1)}°</span>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>
      )}
    </div>
  );
}
