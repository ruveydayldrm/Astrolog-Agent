import { SignIcon, PlanetIcon, SparkleIcon } from "@/components/icons/AstroIcons";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink, Eyebrow, GlassCard } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/Reveal";
import { SIGNS } from "@/lib/astro/constants";
import { HeroTitle } from "./_landing/HeroTitle";

const FEATURES = [
  {
    icon: "sun" as const,
    title: "Gerçek gökyüzü, gerçek hesap",
    body: "Doğduğun an gökyüzü nasıldıysa öyle. Gezegen konumların, yükselenin ve 12 evin astronomik efemerisle hesaplanır; tahmin değil, ölçüm.",
  },
  {
    icon: "moon" as const,
    title: "Seni hatırlayan bir astrolog",
    body: "Lyra konuştuklarınızı unutmaz. Geçen hafta bahsettiğin iş görüşmesini, kafanı kurcalayan ilişkiyi hatırlar ve sorar.",
  },
  {
    icon: "venus" as const,
    title: "Her gün sana özel bir not",
    body: "Bugünün gezegenleri senin haritanda neye dokunuyor? Her sabah, yalnızca senin için yazılmış kısa bir gökyüzü notu.",
  },
];

const STEPS = [
  { n: "I", title: "Doğum bilgilerini gir", body: "Tarih, saat ve şehir. Saatini bilmiyorsan sorun değil." },
  { n: "II", title: "Haritanı keşfet", body: "İnteraktif çemberinde her gezegenin hikâyesini oku." },
  { n: "III", title: "Lyra ile konuş", body: "Merak ettiğini sor; haritan ve bugünün gökyüzüyle cevap versin." },
];

export default function LandingPage() {
  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-2">
          <ButtonLink href="/giris" variant="subtle" className="px-4 py-2">
            Giriş yap
          </ButtonLink>
          <ButtonLink href="/kayit" variant="ghost" className="hidden px-5 py-2 sm:inline-flex">
            Kayıt ol
          </ButtonLink>
        </nav>
      </header>

      <main className="flex-1">
        {/* ---------- Hero ---------- */}
        <section className="relative mx-auto flex max-w-6xl flex-col items-center px-5 pb-24 pt-10 text-center sm:px-8 sm:pt-20">
          <ZodiacRing />
          <Eyebrow className="mb-6">Yapay zekâ destekli kişisel astrolog</Eyebrow>
          <HeroTitle />
          <p className="mt-6 max-w-xl text-base leading-relaxed text-silver-300 sm:text-lg">
            Doğum haritanı gerçek astronomik verilerle çıkaran, seni tanıyan ve her konuşmayı hatırlayan bir rehber. Gökyüzü
            sana ne anlatıyor, birlikte okuyalım.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <ButtonLink href="/kayit" className="px-8 py-4 text-base">
              <SparkleIcon className="h-5 w-5" />
              Haritanı keşfet
            </ButtonLink>
            <ButtonLink href="/giris" variant="subtle">
              Zaten hesabım var
            </ButtonLink>
          </div>
        </section>

        {/* ---------- Özellikler ---------- */}
        <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.1}>
                <GlassCard className="h-full transition-transform duration-300 hover:-translate-y-1">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-gold-500/30 bg-gold-500/5 text-gold-400">
                    <PlanetIcon planet={f.icon} className="h-6 w-6" />
                  </div>
                  <h3 className="font-serif text-2xl text-silver-100">{f.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-silver-300">{f.body}</p>
                </GlassCard>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- Nasıl çalışır ---------- */}
        <section className="mx-auto max-w-4xl px-5 pb-28 sm:px-8">
          <Reveal className="mb-12 text-center">
            <Eyebrow>Üç adımda</Eyebrow>
            <h2 className="mt-3 font-serif text-4xl text-silver-100 sm:text-5xl">Yıldızlarla tanışma</h2>
          </Reveal>
          <ol className="relative space-y-6">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.12}>
                <li className="glass flex items-start gap-5 rounded-3xl p-5 sm:p-6">
                  <span className="gold-text font-serif text-3xl font-semibold">{s.n}</span>
                  <div>
                    <h3 className="font-serif text-2xl text-silver-100">{s.title}</h3>
                    <p className="mt-1 text-sm text-silver-300">{s.body}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
          <Reveal className="mt-14 text-center">
            <ButtonLink href="/kayit" className="px-8 py-4 text-base">
              Haritanı keşfet
            </ButtonLink>
          </Reveal>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-5 pb-10 sm:px-8">
        <div className="divider-gold mb-6" />
        <p className="text-center text-xs text-silver-500">
          Lyra bir öz-farkındalık aracıdır; sağlık, hukuk ve finans kararları için bir uzmana danışmanı öneririz.
        </p>
      </footer>
    </>
  );
}

/** Hero arkasında yavaşça dönen zodyak çemberi (dekoratif). */
function ZodiacRing() {
  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 -z-10 w-[min(720px,140vw)] -translate-x-1/2 opacity-40">
      <div className="aspect-square animate-[spin_180s_linear_infinite]">
        <svg viewBox="0 0 400 400" className="h-full w-full text-gold-500">
          <circle cx="200" cy="200" r="190" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
          <circle cx="200" cy="200" r="150" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.4" />
          {SIGNS.map((s, i) => {
            const a = ((i * 30 + 15) * Math.PI) / 180;
            const x = 200 + 170 * Math.cos(a);
            const y = 200 + 170 * Math.sin(a);
            const lx = Math.cos((i * 30 * Math.PI) / 180);
            const ly = Math.sin((i * 30 * Math.PI) / 180);
            return (
              <g key={s.key}>
                <line x1={200 + 150 * lx} y1={200 + 150 * ly} x2={200 + 190 * lx} y2={200 + 190 * ly} stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
                <foreignObject x={x - 9} y={y - 9} width="18" height="18">
                  <SignIcon sign={s.key} className="h-[18px] w-[18px] text-gold-400" strokeWidth={1.2} />
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
