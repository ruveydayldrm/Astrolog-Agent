"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button, Eyebrow, GlassCard, Input, Label, Notice } from "@/components/ui/primitives";
import type { PlaceResult } from "@/lib/lyra/protocol";
import { cn } from "@/lib/cn";
import { saveBirthData, type BirthInput } from "./actions";

type Place = BirthInput["place"];
interface WizardState {
  name: string;
  date: string;
  time: string | null;
  place: Place | null;
}

const STEPS = ["Adın", "Doğum tarihi", "Doğum saati", "Doğum yeri", "Onay"] as const;

export function BirthWizard({ initial, editing }: { initial: WizardState; editing: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState<WizardState>(initial);
  const [timeUnknown, setTimeUnknown] = useState(editing && initial.time === null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const canContinue = [
    data.name.trim().length > 0,
    /^\d{4}-\d{2}-\d{2}$/.test(data.date),
    timeUnknown || /^\d{2}:\d{2}$/.test(data.time ?? ""),
    data.place !== null,
    true,
  ][step];

  const go = (delta: number) => {
    setError(null);
    setDir(delta);
    setStep((s) => Math.min(Math.max(s + delta, 0), STEPS.length - 1));
  };

  const submit = () =>
    startSaving(async () => {
      const res = await saveBirthData({
        name: data.name.trim(),
        date: data.date,
        time: timeUnknown ? null : data.time,
        place: data.place!,
      });
      if (res.ok) {
        router.push("/harita");
        router.refresh();
      } else setError(res.error);
    });

  return (
    <GlassCard className="overflow-hidden">
      <Eyebrow>{editing ? "Bilgilerini güncelle" : "Haritanı hazırlayalım"}</Eyebrow>

      {/* Adım göstergesi */}
      <ol className="mt-4 flex gap-2" aria-label="Adımlar">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1">
            <span className="sr-only">{label}</span>
            <motion.div
              className={cn("h-1 rounded-full", i <= step ? "bg-gold-500" : "bg-white/10")}
              animate={{ opacity: i <= step ? 1 : 0.6 }}
            />
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-silver-500">
        Adım {step + 1} / {STEPS.length} · {STEPS[step]}
      </p>

      <form
        className="relative mt-8 min-h-[260px]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canContinue) return;
          if (step < STEPS.length - 1) go(1);
          else submit();
        }}
      >
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {step === 0 && (
              <StepShell title="Sana nasıl seslenelim?" hint="Lyra seninle bu isimle konuşacak.">
                <Label htmlFor="name">Adın</Label>
                <Input id="name" autoFocus value={data.name} maxLength={60} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="Örn. Elif" />
              </StepShell>
            )}

            {step === 1 && (
              <StepShell title="Hangi gün dünyaya geldin?" hint="Gezegenlerin konumu bu tarihe göre hesaplanır.">
                <Label htmlFor="date">Doğum tarihi</Label>
                <Input
                  id="date"
                  type="date"
                  autoFocus
                  min="1900-01-01"
                  max={new Date().toISOString().slice(0, 10)}
                  value={data.date}
                  onChange={(e) => setData({ ...data, date: e.target.value })}
                />
              </StepShell>
            )}

            {step === 2 && (
              <StepShell title="Peki saat kaçtı?" hint="Yükselen burcun ve evlerin için doğum saati gerekir. Nüfus kaydında ya da ailende bulabilirsin.">
                <Label htmlFor="time">Doğum saati</Label>
                <Input
                  id="time"
                  type="time"
                  autoFocus
                  disabled={timeUnknown}
                  value={data.time ?? ""}
                  onChange={(e) => setData({ ...data, time: e.target.value || null })}
                />
                <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-silver-300">
                  <input type="checkbox" className="h-4 w-4 accent-[#D4AF37]" checked={timeUnknown} onChange={(e) => setTimeUnknown(e.target.checked)} />
                  Doğum saatimi bilmiyorum
                </label>
                {timeUnknown && (
                  <Notice tone="info" className="mt-4">
                    Sorun değil. Gezegen konumların hesaplanır, ancak yükselen burç ve evler saat olmadan belirlenemez.
                  </Notice>
                )}
              </StepShell>
            )}

            {step === 3 && (
              <StepShell title="Nerede doğdun?" hint="Koordinat ve saat dilimini otomatik bulacağız.">
                <PlaceSearch value={data.place} onChange={(place) => setData({ ...data, place })} />
              </StepShell>
            )}

            {step === 4 && (
              <StepShell title="Her şey doğru mu?" hint="Onayladığında haritan hesaplanacak.">
                <dl className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-night-900/40 text-sm">
                  <Row label="Ad" value={data.name} />
                  <Row label="Tarih" value={new Date(`${data.date}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} />
                  <Row label="Saat" value={timeUnknown ? "Bilinmiyor" : (data.time ?? "")} />
                  <Row label="Yer" value={data.place?.name ?? ""} />
                  <Row label="Saat dilimi" value={data.place?.timezone ?? ""} />
                </dl>
              </StepShell>
            )}
          </motion.div>
        </AnimatePresence>

        {error && <Notice className="mt-6">{error}</Notice>}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button type="button" variant="subtle" onClick={() => go(-1)} disabled={step === 0 || saving}>
            Geri
          </Button>
          <Button type="submit" disabled={!canContinue || saving}>
            {step < STEPS.length - 1 ? "Devam" : saving ? "Yıldızlar hizalanıyor…" : "Haritamı çıkar"}
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}

function StepShell({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-serif text-3xl text-silver-100 sm:text-4xl">{title}</h2>
      <p className="mb-6 mt-2 text-sm text-silver-300">{hint}</p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3">
      <dt className="text-silver-500">{label}</dt>
      <dd className="text-right text-silver-100">{value}</dd>
    </div>
  );
}

/** Debounce'lu şehir arama; sonuç seçilince koordinat + saat dilimi kaydedilir. */
function PlaceSearch({ value, onChange }: { value: Place | null; onChange: (p: Place | null) => void }) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (value && query === value.name) return; // seçim yapıldı, aramaya gerek yok
    if (query.trim().length < 2) return; // kısa sorgu: sonuçlar render sırasında gizlenir
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`, { signal: ctrl.signal });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);
        setResults(json.results);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError((e as Error).message || "Şehir aramasında bir sorun oldu.");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, value]);

  const visible = query.trim().length >= 2 ? results : [];

  return (
    <div>
      <Label htmlFor="place">Şehir</Label>
      <Input
        id="place"
        autoFocus
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (value) onChange(null);
        }}
        placeholder="Örn. İzmir"
        role="combobox"
        aria-expanded={visible.length > 0}
        aria-controls="place-results"
      />
      {loading && <p className="shimmer-text mt-3 text-sm">Haritada arıyoruz…</p>}
      {error && <Notice className="mt-3">{error}</Notice>}

      {value ? (
        <p className="mt-3 text-xs text-silver-500">
          {value.latitude.toFixed(2)}°, {value.longitude.toFixed(2)}° · {value.timezone}
        </p>
      ) : (
        visible.length > 0 && (
          <ul id="place-results" role="listbox" className="mt-3 max-h-56 overflow-y-auto rounded-2xl border border-white/10 bg-night-900/80">
            {visible.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  className="w-full px-4 py-3 text-left text-sm transition hover:bg-gold-500/10 focus:bg-gold-500/10 focus:outline-none"
                  onClick={() => {
                    const name = r.region ? `${r.name}, ${r.region}` : r.name;
                    setQuery(name);
                    setResults([]);
                    onChange({ name, latitude: r.latitude, longitude: r.longitude, timezone: r.timezone });
                  }}
                >
                  <span className="text-silver-100">{r.name}</span>
                  <span className="ml-2 text-silver-500">{r.region}</span>
                </button>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
