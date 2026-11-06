import "server-only";
import { DateTime } from "luxon";
import { computeTransits, natalChartToPrompt, transitsToPrompt, type TransitSnapshot } from "../astro";
import { trimTime, type MemoryRow, type OnboardedProfile } from "../db";
import { fillSystemPrompt } from "./systemPrompt";

const MEMORY_HEADINGS: Record<MemoryRow["kind"], string> = {
  fact: "Kullanıcı hakkında bildiklerin",
  follow_up: "Takip edilecek konular",
  reading: "Daha önce yaptığın önemli yorumlar (bunlarla tutarlı kal)",
};

/** Hafıza kayıtlarını prompt için gruplu madde listesine çevirir. */
export function memoriesToPrompt(memories: MemoryRow[]): string {
  if (memories.length === 0) return "(Henüz kayıtlı bir hafıza yok; bu kullanıcıyla ilk sohbetlerinizden biri olabilir.)";
  return (Object.keys(MEMORY_HEADINGS) as MemoryRow["kind"][])
    .map((kind) => {
      const items = memories.filter((m) => m.kind === kind);
      if (items.length === 0) return null;
      return `${MEMORY_HEADINGS[kind]}:\n${items.map((m) => `- ${m.content}`).join("\n")}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

export interface LyraContext {
  system: string;
  transits: TransitSnapshot;
  todayLabel: string;
}

/**
 * Bir istek için Lyra'nın sistem promptunu kurar:
 * doğum haritası + bugünün transitleri (kullanıcının saat diliminde) + hafıza.
 */
export function buildLyraContext(profile: OnboardedProfile, memories: MemoryRow[], now = new Date()): LyraContext {
  const transits = computeTransits(profile.natal_chart, now);
  const todayLabel = DateTime.fromJSDate(now, { zone: profile.timezone }).setLocale("tr").toFormat("d MMMM yyyy, cccc");

  const system = fillSystemPrompt({
    DOGUM_HARITASI: natalChartToPrompt(profile.natal_chart, {
      name: profile.display_name,
      birthDate: profile.birth_date,
      birthTime: trimTime(profile.birth_time),
      place: profile.birth_place,
    }),
    BUGUNUN_TARIHI: todayLabel,
    GUNCEL_TRANSITLER: transitsToPrompt(transits),
    KULLANICI_HAFIZASI: memoriesToPrompt(memories),
  });

  return { system, transits, todayLabel };
}
