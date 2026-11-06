import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { formatAspect, todayIn, type Aspect } from "../astro";
import { listMemories, type OnboardedProfile } from "../db";
import { enforceRateLimit } from "../rate-limit";
import { fallbackParams, getAnthropic, UTILITY_MODEL } from "./anthropic";
import { buildLyraContext } from "./context";

export interface DailyTransit {
  label: string;
  a: Aspect["a"];
  b: Aspect["b"];
  type: Aspect["type"];
  typeName: string;
  orb: number;
  applying: boolean;
}

export interface DailyNote {
  date: string;
  transits: DailyTransit[];
  note: string;
}

/** Günlük karta konulacak öne çıkan transit sayısı. */
const TOP_TRANSITS = 4;

/**
 * Kullanıcının bugünkü notunu döndürür. Gün (kullanıcının saat diliminde) başına bir kez
 * üretilir ve daily_notes tablosunda önbelleğe alınır.
 */
export async function getOrCreateDailyNote(supabase: SupabaseClient, profile: OnboardedProfile): Promise<DailyNote> {
  const date = todayIn(profile.timezone);

  const { data: cached } = await supabase
    .from("daily_notes")
    .select("note_date, transits, note")
    .eq("user_id", profile.id)
    .eq("note_date", date)
    .maybeSingle();
  if (cached) return { date: cached.note_date, transits: cached.transits as DailyTransit[], note: cached.note };

  await enforceRateLimit(supabase, "daily");
  const memories = await listMemories(supabase);
  const { system, transits } = buildLyraContext(profile, memories);

  const top: DailyTransit[] = transits.aspects.slice(0, TOP_TRANSITS).map((a) => ({
    label: formatAspect(a, true),
    a: a.a,
    b: a.b,
    type: a.type,
    typeName: a.typeName,
    orb: a.orb,
    applying: a.applying ?? false,
  }));

  const response = await getAnthropic().beta.messages.create({
    model: UTILITY_MODEL,
    max_tokens: 4000,
    ...fallbackParams(UTILITY_MODEL),
    output_config: { effort: "low" },
    system,
    messages: [
      {
        role: "user",
        content:
          "Ana panelimde görünecek bugünkü kısa günlük notunu yaz. En öne çıkan bir ya da iki transite odaklan, " +
          "haritamdaki karşılığını ve günüme nasıl yansıyabileceğini anlat. En fazla 3 cümle, başlık ve liste kullanma, " +
          "tek paragraf. Doğrudan nota başla.",
      },
    ],
  });

  const note =
    response.content
      .flatMap((b) => (b.type === "text" ? [b.text] : []))
      .join("")
      .trim() || "Bugün gökyüzü sessiz; kendine biraz alan açmak için güzel bir gün olabilir. 🌙";

  // Aynı anda iki istek gelirse ilk yazılan kazanır
  await supabase
    .from("daily_notes")
    .upsert({ user_id: profile.id, note_date: date, transits: top, note }, { onConflict: "user_id,note_date", ignoreDuplicates: true });

  return { date, transits: top, note };
}
