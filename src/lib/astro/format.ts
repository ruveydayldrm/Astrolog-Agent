import type { Aspect } from "./aspects";
import type { NatalChart, TransitSnapshot } from "./chart";
import type { ZodiacPosition } from "./positions";

/** 23.5 → "23°30′" */
export function formatDegree(deg: number): string {
  let d = Math.floor(deg);
  let m = Math.round((deg - d) * 60);
  if (m === 60) {
    d += 1;
    m = 0;
  }
  return `${d}°${String(m).padStart(2, "0")}′`;
}

export function formatPosition(p: ZodiacPosition): string {
  return `${formatDegree(p.degreeInSign)} ${p.signName}`;
}

export function formatAspect(a: Aspect, transit = false): string {
  const prefix = transit ? `Transit ${a.aName}` : a.aName;
  const target = transit ? `natal ${a.bName}` : a.bName;
  const motion = a.applying === undefined ? "" : a.applying ? ", yaklaşıyor" : ", ayrılıyor";
  return `${prefix} ${a.typeName} ${target} (orb ${a.orb.toFixed(1)}°${motion})`;
}

/**
 * Doğum haritasını LLM için yapılandırılmış, kısa bir metne çevirir.
 * Biçim sabit tutulur ki model her seferinde aynı şekilde okusun.
 */
export function natalChartToPrompt(chart: NatalChart, meta: { name: string; birthDate: string; birthTime: string | null; place: string }): string {
  const lines: string[] = [];
  lines.push(`Ad: ${meta.name}`);
  lines.push(`Doğum: ${meta.birthDate} ${meta.birthTime ?? "(saat bilinmiyor)"} — ${meta.place}`);
  lines.push("");
  lines.push("Gezegenler:");
  for (const p of chart.planets) {
    const house = p.house ? `, ${p.house}. ev` : "";
    lines.push(`- ${p.name}: ${formatPosition(p)}${house}${p.retrograde ? " (retro)" : ""}`);
  }
  lines.push("");
  if (chart.ascendant && chart.midheaven && chart.houses) {
    lines.push(`Yükselen: ${formatPosition(chart.ascendant)}`);
    lines.push(`MC (Tepe Noktası): ${formatPosition(chart.midheaven)}`);
    lines.push(`Ev sistemi: ${chart.houses.system === "placidus" ? "Placidus" : "Whole Sign"}`);
    lines.push("Ev başlangıçları:");
    chart.houses.cusps.forEach((c, i) => lines.push(`- ${i + 1}. ev: ${formatPosition(c)}`));
  } else {
    lines.push("Doğum saati BİLİNMİYOR: yükselen burç, MC ve evler hesaplanmadı. Ay'ın derecesi gün içinde ±6° kayabilir.");
  }
  lines.push("");
  lines.push("Ana açılar:");
  if (chart.aspects.length === 0) lines.push("- (yok)");
  for (const a of chart.aspects) lines.push(`- ${formatAspect(a)}`);
  return lines.join("\n");
}

export function transitsToPrompt(t: TransitSnapshot, limit = 12): string {
  const lines: string[] = ["Gökyüzündeki konumlar:"];
  for (const p of t.planets) {
    const house = t.housePlacements[p.key];
    lines.push(`- ${p.name}: ${formatPosition(p)}${p.retrograde ? " (retro)" : ""}${house ? ` — natal ${house}. evinde` : ""}`);
  }
  lines.push("");
  lines.push("Natal haritaya transit açılar (en dar orbdan geniş orba):");
  const list = t.aspects.slice(0, limit);
  if (list.length === 0) lines.push("- (dar orblu transit açı yok)");
  for (const a of list) lines.push(`- ${formatAspect(a, true)}`);
  return lines.join("\n");
}
