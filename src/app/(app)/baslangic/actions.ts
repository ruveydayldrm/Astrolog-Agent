"use server";

import { IANAZone } from "luxon";
import { z } from "zod";
import { computeNatalChart } from "@/lib/astro";
import { getUser } from "@/lib/supabase/server";

const birthSchema = z.object({
  name: z.string().trim().min(1, "Adını yazmayı unutma.").max(60),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Doğum tarihini seç.")
    .refine((d) => d >= "1900-01-01" && d <= new Date().toISOString().slice(0, 10), "Doğum tarihi 1900 ile bugün arasında olmalı."),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable(),
  place: z.object({
    name: z.string().min(1).max(160),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    timezone: z.string().refine((tz) => IANAZone.isValidZone(tz), "Saat dilimi tanınmadı."),
  }),
});

export type BirthInput = z.infer<typeof birthSchema>;

/** Doğum bilgisini doğrular, haritayı hesaplar ve profile kaydeder. */
export async function saveBirthData(input: BirthInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = birthSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Bilgilerde bir eksik var." };

  const { supabase, user } = await getUser();
  if (!user) return { ok: false, error: "Oturumun sona ermiş, lütfen tekrar giriş yap." };

  const { name, date, time, place } = parsed.data;
  const chart = computeNatalChart({ date, time, latitude: place.latitude, longitude: place.longitude, timeZone: place.timezone });

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: name,
      birth_date: date,
      birth_time: time,
      birth_place: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      timezone: place.timezone,
      natal_chart: chart,
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("[lyra] profil kaydı:", error.message);
    return { ok: false, error: "Bilgilerini kaydederken bir aksilik oldu. Lütfen tekrar dene." };
  }

  // Doğum bilgisi değiştiyse eski günlük notlar geçersizdir
  await supabase.from("daily_notes").delete().eq("user_id", user.id);
  return { ok: true };
}
