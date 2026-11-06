import type { Metadata } from "next";
import Link from "next/link";
import { ChartWheel } from "@/components/chart/ChartWheel";
import { PlanetIcon, SignIcon } from "@/components/icons/AstroIcons";
import { ButtonLink, Eyebrow, GlassCard, Notice } from "@/components/ui/primitives";
import { ASPECTS, HOUSE_THEMES } from "@/lib/astro/constants";
import { formatPosition } from "@/lib/astro/format";
import { trimTime } from "@/lib/db";
import { requireOnboarded } from "@/lib/session";

export const metadata: Metadata = { title: "Doğum haritam" };

const ASPECT_SYMBOL = Object.fromEntries(ASPECTS.map((a) => [a.key, a.symbol]));

export default async function ChartPage() {
  const { profile } = await requireOnboarded();
  const chart = profile.natal_chart;
  const sun = chart.planets.find((p) => p.key === "sun")!;
  const moon = chart.planets.find((p) => p.key === "moon")!;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>Doğum haritası</Eyebrow>
          <h1 className="mt-2 font-serif text-4xl text-silver-100 sm:text-5xl">{profile.display_name}</h1>
          <p className="mt-1 text-sm text-silver-300">
            {new Date(`${profile.birth_date}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
            {" · "}
            {trimTime(profile.birth_time) ?? "saat bilinmiyor"} · {profile.birth_place}
          </p>
        </div>
        <ButtonLink href="/baslangic" variant="ghost" className="self-start sm:self-auto">
          Bilgileri düzenle
        </ButtonLink>
      </div>

      {/* Büyük üçlü */}
      <div className="grid grid-cols-3 gap-3">
        <BigThree label="Güneş" sign={sun.sign} value={formatPosition(sun)} />
        <BigThree label="Ay" sign={moon.sign} value={formatPosition(moon)} />
        {chart.ascendant ? (
          <BigThree label="Yükselen" sign={chart.ascendant.sign} value={formatPosition(chart.ascendant)} />
        ) : (
          <div className="glass flex flex-col items-center justify-center rounded-2xl p-3 text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-silver-500">Yükselen</p>
            <p className="mt-1 text-xs text-silver-300">Saat gerekli</p>
          </div>
        )}
      </div>

      {!chart.timeKnown && (
        <Notice tone="info">
          Doğum saatin bilinmediği için <strong>yükselen burç ve evler hesaplanmadı</strong>. Gezegenlerin konumu öğlen 12:00 esas
          alınarak hesaplandı; Ay gün içinde yaklaşık 13° yol aldığı için derecesi birkaç derece farklı olabilir.{" "}
          <Link href="/baslangic" className="text-gold-300 underline">
            Saatini öğrenirsen ekle
          </Link>
          .
        </Notice>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <GlassCard className="p-3 sm:p-6">
          <ChartWheel chart={chart} />
          <p className="mt-2 text-center text-xs text-silver-500">Bir gezegenin üzerine gel ya da dokun.</p>
        </GlassCard>

        <GlassCard>
          <h2 className="font-serif text-2xl">Gezegenler</h2>
          <ul className="mt-4 divide-y divide-white/5">
            {chart.planets.map((p) => (
              <li key={p.key} className="flex items-center gap-3 py-2.5 text-sm">
                <PlanetIcon planet={p.key} className="h-5 w-5 shrink-0 text-gold-400" />
                <span className="w-20 text-silver-100">{p.name}</span>
                <SignIcon sign={p.sign} className="h-4 w-4 shrink-0 text-lilac-300" />
                <span className="flex-1 text-silver-300">
                  {formatPosition(p)}
                  {p.retrograde && <span className="ml-1.5 text-rose-400">R</span>}
                </span>
                {p.house && <span className="text-xs text-silver-500">{p.house}. ev</span>}
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {chart.houses && (
          <GlassCard>
            <h2 className="font-serif text-2xl">Evler</h2>
            <p className="text-xs text-silver-500">{chart.houses.system === "placidus" ? "Placidus" : "Whole Sign (yüksek enlem)"}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {chart.houses.cusps.map((c, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-8 font-serif text-lg text-gold-400">{i + 1}</span>
                  <span className="w-28 shrink-0 text-silver-100">{formatPosition(c)}</span>
                  <span className="text-silver-500">{HOUSE_THEMES[i]}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        )}

        <GlassCard className={chart.houses ? "" : "lg:col-span-2"}>
          <h2 className="font-serif text-2xl">Ana açılar</h2>
          <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-1">
            {chart.aspects.map((a, i) => (
              <li key={i} className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2">
                <span className="w-5 text-center text-lilac-300">{ASPECT_SYMBOL[a.type]}</span>
                <span className="flex-1 text-silver-100">
                  {a.aName} {a.typeName.toLowerCase()} {a.bName}
                </span>
                <span className="text-xs text-silver-500">{a.orb.toFixed(1)}°</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}

function BigThree({ label, sign, value }: { label: string; sign: Parameters<typeof SignIcon>[0]["sign"]; value: string }) {
  return (
    <div className="glass flex flex-col items-center rounded-2xl p-3 text-center sm:p-5">
      <SignIcon sign={sign} className="h-7 w-7 text-gold-400 sm:h-9 sm:w-9" />
      <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-silver-500">{label}</p>
      <p className="mt-0.5 font-serif text-base text-silver-100 sm:text-xl">{value}</p>
    </div>
  );
}
