import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Sunucu bileşenleri, server action'lar ve route handler'lar için Supabase istemcisi.
 * Kullanıcının oturum çerezini taşır → tüm sorgular RLS altında çalışır.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Sunucu bileşeninden çağrıldıysa çerez yazılamaz; proxy oturumu tazeler.
        }
      },
    },
  });
}

/** Oturumdaki kullanıcıyı döndürür (JWT sunucuda doğrulanır). */
export async function getUser() {
  if (!isSupabaseConfigured()) {
    // Kurulum tamamlanmadıysa "oturum yok" gibi davran; çağıranlar user null iken istemciyi kullanmaz.
    return { supabase: null as unknown as Awaited<ReturnType<typeof createClient>>, user: null };
  }
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}
