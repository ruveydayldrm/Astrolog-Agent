import "server-only";
import { redirect } from "next/navigation";
import { getProfile, isOnboarded } from "./db";
import { getUser } from "./supabase/server";

/** Sunucu sayfaları için: oturum yoksa girişe yönlendirir. */
export async function requireUser() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/giris");
  return { supabase, user };
}

/** Sunucu sayfaları için: doğum bilgisi yoksa sihirbaza yönlendirir. */
export async function requireOnboarded() {
  const { supabase, user } = await requireUser();
  const profile = await getProfile(supabase, user.id);
  if (!isOnboarded(profile)) redirect("/baslangic");
  return { supabase, user, profile };
}
