import type { Metadata } from "next";
import { Button, ButtonLink, Eyebrow, GlassCard } from "@/components/ui/primitives";
import { listMemories, trimTime } from "@/lib/db";
import { requireOnboarded } from "@/lib/session";
import { signOut } from "../../(auth)/actions";
import { MemoryManager } from "./MemoryManager";

export const metadata: Metadata = { title: "Ayarlar" };

export default async function SettingsPage() {
  const { supabase, user, profile } = await requireOnboarded();
  const memories = await listMemories(supabase);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Eyebrow>Ayarlar</Eyebrow>
        <h1 className="mt-2 font-serif text-4xl text-silver-100">Senin alanın</h1>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl">Profil</h2>
            <p className="mt-2 text-sm text-silver-300">{profile.display_name} · {user.email}</p>
            <p className="text-sm text-silver-500">
              {profile.birth_date} · {trimTime(profile.birth_time) ?? "saat bilinmiyor"} · {profile.birth_place}
            </p>
          </div>
          <ButtonLink href="/baslangic" variant="ghost" className="py-2">
            Doğum bilgilerini düzenle
          </ButtonLink>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="font-serif text-2xl">Lyra&apos;nın hafızası</h2>
        <p className="mb-6 mt-1 text-sm text-silver-300">
          Lyra sohbetlerinden önemli noktaları kısa maddeler halinde hatırlar. Buradan istediğini silebilirsin; silinen bilgi bir daha
          kullanılmaz.
        </p>
        <MemoryManager memories={memories} />
      </GlassCard>

      <form action={signOut} className="text-center">
        <Button variant="subtle" type="submit">
          Çıkış yap
        </Button>
      </form>
    </div>
  );
}
