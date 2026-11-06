import { Logo } from "@/components/ui/Logo";
import { GlassCard } from "@/components/ui/primitives";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { AppNav } from "./AppNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <GlassCard className="max-w-lg text-center">
          <h1 className="font-serif text-3xl">Kurulum gerekiyor</h1>
          <p className="mt-3 text-sm text-silver-300">
            Supabase bağlantısı yapılandırılmamış. <code>.env.example</code> dosyasını <code>.env.local</code> olarak kopyalayıp
            anahtarlarını ekledikten sonra sunucuyu yeniden başlat.
          </p>
        </GlassCard>
      </main>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/5 bg-night-900/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          <Logo href="/panel" />
          <AppNav variant="top" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-8 md:pb-12">{children}</main>
      <AppNav variant="bottom" />
    </>
  );
}
