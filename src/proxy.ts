import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/** Oturum gerektiren yollar. */
const PROTECTED = ["/panel", "/harita", "/sohbet", "/ayarlar", "/baslangic"];
/** Oturum açıkken gösterilmeyecek yollar. */
const AUTH_ONLY = ["/giris", "/kayit"];

/**
 * Next.js 16 proxy (eski adıyla middleware):
 * 1) Supabase oturum çerezini her istekte tazeler.
 * 2) Korunan sayfalara oturumsuz erişimi /giris'e yönlendirir.
 */
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const redirect = (to: string) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = to === "/giris" ? `?next=${encodeURIComponent(path)}` : "";
    const r = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  };

  if (!user && PROTECTED.some((p) => path.startsWith(p))) return redirect("/giris");
  if (user && AUTH_ONLY.some((p) => path.startsWith(p))) return redirect("/panel");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
