import type { Metadata } from "next";
import Link from "next/link";
import { DateTime } from "luxon";
import { PlanetIcon, SignIcon, SparkleIcon } from "@/components/icons/AstroIcons";
import { Eyebrow, GlassCard } from "@/components/ui/primitives";
import { formatPosition } from "@/lib/astro/format";
import { requireOnboarded } from "@/lib/session";
import { DailyCard } from "./DailyCard";

export const metadata: Metadata = { title: "Panel" };

function greeting(hour: number) {
  if (hour < 5) return "İyi geceler";
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

export default async function DashboardPage() {
  const { supabase, profile } = await requireOnboarded();
  const now = DateTime.now().setZone(profile.timezone).setLocale("tr");
  const chart = profile.natal_chart;
  const sun = chart.planets.find((p) => p.key === "sun")!;
  const moon = chart.planets.find((p) => p.key === "moon")!;

  const { data: recent } = await supabase.from("conversations").select("id, title, updated_at").order("updated_at", { ascending: false }).limit(3);

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>{greeting(now.hour)}</Eyebrow>
        <h1 className="mt-2 font-serif text-4xl text-silver-100 sm:text-5xl">{profile.display_name}</h1>
      </div>

      <DailyCard todayLabel={now.toFormat("d MMMM, cccc")} />

      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/harita" className="group">
          <GlassCard className="h-full transition group-hover:-translate-y-1 group-hover:border-gold-500/40">
            <Eyebrow>Haritam</Eyebrow>
            <div className="mt-5 space-y-3">
              <Placement icon={<SignIcon sign={sun.sign} className="h-5 w-5" />} label="Güneş" value={formatPosition(sun)} />
              <Placement icon={<SignIcon sign={moon.sign} className="h-5 w-5" />} label="Ay" value={formatPosition(moon)} />
              {chart.ascendant ? (
                <Placement icon={<SignIcon sign={chart.ascendant.sign} className="h-5 w-5" />} label="Yükselen" value={formatPosition(chart.ascendant)} />
              ) : (
                <Placement icon={<PlanetIcon planet="sun" className="h-5 w-5" />} label="Yükselen" value="Doğum saati gerekli" />
              )}
            </div>
            <p className="mt-6 text-sm text-gold-300 transition group-hover:translate-x-1">Haritanın tamamını gör →</p>
          </GlassCard>
        </Link>

        <GlassCard className="flex flex-col">
          <Eyebrow>Lyra ile sohbet</Eyebrow>
          {recent && recent.length > 0 ? (
            <ul className="mt-4 flex-1 space-y-1">
              {recent.map((c) => (
                <li key={c.id}>
                  <Link href={`/sohbet/${c.id}`} className="block truncate rounded-xl px-3 py-2 text-sm text-silver-300 transition hover:bg-white/5 hover:text-silver-100">
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 flex-1 text-sm text-silver-300">Haritan hakkında merak ettiğin her şeyi sorabilirsin. Lyra seni dinlemeye hazır.</p>
          )}
          <Link
            href="/sohbet"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-b from-gold-400 to-gold-600 px-6 py-3 text-sm font-semibold text-night-900 shadow-glow transition hover:brightness-110"
          >
            <SparkleIcon className="h-4 w-4" /> Yeni sohbet başlat
          </Link>
        </GlassCard>
      </div>
    </div>
  );
}

function Placement({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-500/30 text-gold-400">{icon}</span>
      <span className="w-20 text-xs uppercase tracking-[0.15em] text-silver-500">{label}</span>
      <span className="font-serif text-lg text-silver-100">{value}</span>
    </div>
  );
}
