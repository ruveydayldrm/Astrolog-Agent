"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { motion } from "framer-motion";
import { Button, GlassCard, Input, Label, Notice } from "@/components/ui/primitives";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { signIn, signUp, type AuthState } from "./actions";

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? signIn : signUp, {});
  const [googleError, setGoogleError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  const google = async () => {
    setGoogleError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next ?? "/panel")}` },
    });
    if (error) setGoogleError("Google ile bağlanırken bir sorun oldu. Lütfen tekrar dene.");
  };

  const isLogin = mode === "login";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
      <GlassCard>
        <h1 className="text-center font-serif text-4xl text-silver-100">{isLogin ? "Yeniden hoş geldin" : "Yıldızlara katıl"}</h1>
        <p className="mt-2 text-center text-sm text-silver-300">
          {isLogin ? "Lyra seni bekliyordu." : "Haritanı keşfetmeye bir adım kaldı."}
        </p>

        {!configured && (
          <Notice tone="info" className="mt-6">
            Supabase bağlantısı henüz yapılandırılmadı. <code>.env</code> dosyasına anahtarları ekleyince giriş aktif olur.
          </Notice>
        )}

        <Button type="button" variant="ghost" onClick={google} disabled={!configured} className="mt-8 w-full">
          <GoogleMark />
          Google ile devam et
        </Button>

        <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-silver-500">
          <span className="h-px flex-1 bg-white/10" />
          veya
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form action={action} className="space-y-5">
          {next && <input type="hidden" name="next" value={next} />}
          <div>
            <Label htmlFor="email">E-posta</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="sen@ornek.com" />
          </div>
          <div>
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              minLength={8}
              placeholder="En az 8 karakter"
            />
          </div>

          {(state.error || googleError) && <Notice>{state.error ?? googleError}</Notice>}
          {state.info && <Notice tone="info">{state.info}</Notice>}

          <Button type="submit" disabled={pending || !configured} className="w-full">
            {pending ? "Bir saniye…" : isLogin ? "Giriş yap" : "Kayıt ol"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-silver-300">
          {isLogin ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
          <Link href={isLogin ? "/kayit" : "/giris"} className="text-gold-300 underline-offset-4 hover:underline">
            {isLogin ? "Kayıt ol" : "Giriş yap"}
          </Link>
        </p>
      </GlassCard>
    </motion.div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}
