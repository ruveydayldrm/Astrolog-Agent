import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "./errors";

/** Kova tanımları: [limit, pencere (sn)]. Bir isteğin tüm kovaları geçmesi gerekir. */
export const LIMITS = {
  chat: [
    ["chat:hour", 30, 3600],
    ["chat:day", 150, 86400],
  ],
  memory: [["memory:hour", 20, 3600]],
  daily: [["daily:day", 5, 86400]],
  geocode: [["geocode:hour", 120, 3600]],
} as const satisfies Record<string, ReadonlyArray<readonly [string, number, number]>>;

/**
 * Kullanıcı başına hız sınırı. Sayım Postgres'te atomik yapılır
 * (bkz. migrations/…_rate_limits.sql), böylece sunucusuz ortamda da tutarlıdır.
 */
export async function enforceRateLimit(supabase: SupabaseClient, kind: keyof typeof LIMITS): Promise<void> {
  for (const [bucket, limit, windowSeconds] of LIMITS[kind]) {
    const { data, error } = await supabase.rpc("consume_rate_limit", {
      p_bucket: bucket,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      // Hız sınırı altyapısı çökerse kullanıcıyı kilitlemek yerine kaydedip devam et
      console.error("[lyra] rate limit hatası:", error.message);
      return;
    }
    if (data === false) throw new AppError("RATE_LIMITED");
  }
}
