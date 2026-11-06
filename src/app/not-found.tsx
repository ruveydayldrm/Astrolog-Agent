import { ButtonLink, GlassCard } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <GlassCard className="max-w-md text-center">
        <p className="gold-text font-serif text-6xl">404</p>
        <h1 className="mt-2 font-serif text-3xl">Bu yıldız haritada yok</h1>
        <p className="mt-2 text-sm text-silver-300">Aradığın sayfa kaybolmuş ya da hiç var olmamış olabilir.</p>
        <ButtonLink href="/" className="mt-6">
          Ana sayfaya dön
        </ButtonLink>
      </GlassCard>
    </main>
  );
}
