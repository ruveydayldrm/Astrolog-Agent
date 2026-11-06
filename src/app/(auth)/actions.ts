"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
  info?: string;
}

const credentials = z.object({
  email: z.email("Geçerli bir e-posta adresi gir."),
  password: z.string().min(8, "Şifren en az 8 karakter olmalı."),
  next: z.string().optional(),
});

/** Supabase Auth hata kodlarını nazik Türkçe mesajlara çevirir. */
function authMessage(code: string | undefined, fallback: string): string {
  switch (code) {
    case "invalid_credentials":
      return "E-posta ya da şifre hatalı görünüyor.";
    case "email_not_confirmed":
      return "Önce e-postana gönderdiğimiz bağlantıyla hesabını onaylaman gerekiyor.";
    case "user_already_exists":
    case "email_exists":
      return "Bu e-postayla zaten bir hesap var. Giriş yapmayı dener misin?";
    case "weak_password":
      return "Bu şifre biraz zayıf; harf, rakam ve sembol karıştırmayı dene.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.";
    default:
      return fallback;
  }
}

/** Yalnızca site içi yönlendirmelere izin ver (open redirect koruması). */
function safeNext(next: string | undefined, fallback: string): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

function parse(formData: FormData) {
  return credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });
}

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: "Supabase henüz yapılandırılmadı (.env dosyasını kontrol et)." };
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) return { error: authMessage(error.code, "Giriş yapılamadı. Lütfen tekrar dene.") };

  redirect(safeNext(parsed.data.next, "/panel"));
}

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: "Supabase henüz yapılandırılmadı (.env dosyasını kontrol et)." };
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${site}/auth/callback?next=/baslangic` },
  });
  if (error) return { error: authMessage(error.code, "Kayıt sırasında bir sorun oldu. Lütfen tekrar dene.") };

  // E-posta onayı kapalıysa oturum hemen açılır
  if (data.session) redirect("/baslangic");
  return { info: "Neredeyse hazır! E-postana bir onay bağlantısı gönderdik. ✨" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
