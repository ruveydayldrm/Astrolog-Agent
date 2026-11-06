import Link from "next/link";

/** Lyra logosu: Lir takımyıldızından esinlenen küçük yıldız kümesi. */
export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5" aria-label="Lyra ana sayfa">
      <svg viewBox="0 0 32 32" className="h-8 w-8 text-gold-400 transition-transform duration-500 group-hover:rotate-12" aria-hidden>
        <g stroke="currentColor" strokeWidth="0.8" opacity="0.55">
          <path d="M16 4L12 14L20 14L16 4M12 14L10 26L18 28L20 14" fill="none" />
        </g>
        <g fill="currentColor">
          <circle cx="16" cy="4" r="2.2" />
          <circle cx="12" cy="14" r="1.3" />
          <circle cx="20" cy="14" r="1.3" />
          <circle cx="10" cy="26" r="1.3" />
          <circle cx="18" cy="28" r="1.3" />
        </g>
      </svg>
      <span className="font-serif text-2xl font-semibold tracking-wide text-silver-100">Lyra</span>
    </Link>
  );
}
