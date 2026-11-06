"use client";

import { Button, GlassCard } from "@/components/ui/primitives";

/** Beklenmeyen hatalar için nazik geri dönüş ekranı. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <GlassCard className="max-w-md text-center">
        <h1 className="font-serif text-3xl">Bir bulut geçti</h1>
        <p className="mt-2 text-sm text-silver-300">Beklenmedik bir şey oldu. Biraz sonra tekrar dener misin?</p>
        <Button onClick={reset} className="mt-6">
          Tekrar dene
        </Button>
      </GlassCard>
    </main>
  );
}
