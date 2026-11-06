"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; error: string };

/** Tek bir hafıza maddesini siler (RLS sahipliği garanti eder). */
export async function deleteMemory(id: string): Promise<Result> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Geçersiz kayıt." };
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, error: "Oturumun sona ermiş, lütfen tekrar giriş yap." };
  const { error } = await supabase.from("memories").delete().eq("id", id);
  if (error) return { ok: false, error: "Silinirken bir sorun oldu, tekrar dener misin?" };
  revalidatePath("/ayarlar");
  return { ok: true };
}

/** Tüm hafızayı sıfırlar; sohbetler yeniden işlenmesin diye işaretlenir. */
export async function resetMemory(): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, error: "Oturumun sona ermiş, lütfen tekrar giriş yap." };
  const { error } = await supabase.from("memories").delete().eq("user_id", user.id);
  if (error) return { ok: false, error: "Hafıza sıfırlanırken bir sorun oldu." };
  // Eski sohbetler bir sonraki tetiklemede hafızayı geri doldurmasın
  await supabase.from("conversations").update({ memory_processed_until: new Date().toISOString() }).eq("user_id", user.id);
  revalidatePath("/ayarlar");
  return { ok: true };
}
