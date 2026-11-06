import type { PlanetKey, SignKey } from "@/lib/astro/constants";

/**
 * İnce çizgili, tutarlı astrolojik ikon seti (24×24, stroke tabanlı).
 * Unicode sembollerin platformlar arası emoji görünümünden kaçınmak için elle çizildi.
 */

type IconProps = { className?: string; strokeWidth?: number; title?: string };

function Svg({ children, className, strokeWidth = 1.4, title }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

const PLANET_PATHS: Record<PlanetKey, React.ReactNode> = {
  sun: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </>
  ),
  moon: <path d="M15.5 3.8a8.5 8.5 0 1 0 0 16.4a7 7 0 0 1 0-16.4z" />,
  mercury: (
    <>
      <path d="M8.5 3.2a3.5 3.5 0 0 0 7 0" />
      <circle cx="12" cy="10" r="4" />
      <path d="M12 14v7M9 18h6" />
    </>
  ),
  venus: (
    <>
      <circle cx="12" cy="8.5" r="5" />
      <path d="M12 13.5V21M9 18h6" />
    </>
  ),
  mars: (
    <>
      <circle cx="10" cy="14" r="5.5" />
      <path d="M14 10l6-6M15 4h5v5" />
    </>
  ),
  jupiter: <path d="M5 8.5c0-3 4.5-4.5 6-1.5c1.3 2.6-3 7.5-6 8.5h14M15.5 4v16.5" />,
  saturn: <path d="M8 3h6M11 1.5v14M11 10c1.5-2.5 6.5-2.5 6.5 1.5c0 3-3 3.8-3 6.5c0 1.6 1.2 2.6 2.6 2.4" />,
  uranus: (
    <>
      <path d="M6 3.5v9M18 3.5v9M6 8h12M12 3.5v10.5" />
      <circle cx="12" cy="17.5" r="2.6" />
      <circle cx="12" cy="17.5" r=".6" fill="currentColor" />
    </>
  ),
  neptune: <path d="M5 4.5c0 5 3 8.5 7 8.5s7-3.5 7-8.5M12 3.5V21M9 18h6M5 4.5l-1 1.5M5 4.5l1 1.5M19 4.5l-1 1.5M19 4.5l1 1.5" />,
  pluto: (
    <>
      <circle cx="12" cy="7" r="3" />
      <path d="M5.5 5c0 5 2.8 8 6.5 8s6.5-3 6.5-8M12 13v8M9 18h6" />
    </>
  ),
};

const SIGN_PATHS: Record<SignKey, React.ReactNode> = {
  aries: <path d="M12 21V9.5M12 9.5C12 5 10 3 7.5 3S3.3 5.2 3.8 8M12 9.5C12 5 14 3 16.5 3s4.2 2.2 3.7 5" />,
  taurus: (
    <>
      <circle cx="12" cy="15" r="5.5" />
      <path d="M4 3.5c1 4 4 6 8 6s7-2 8-6" />
    </>
  ),
  gemini: <path d="M5 4c4.5 1.2 9.5 1.2 14 0M5 20c4.5-1.2 9.5-1.2 14 0M9 5v14M15 5v14" />,
  cancer: (
    <>
      <circle cx="7" cy="9.5" r="2.6" />
      <circle cx="17" cy="14.5" r="2.6" />
      <path d="M4.5 9C6 5.5 13 4.5 19.5 7.5M19.5 15c-1.5 3.5-8.5 4.5-15 1.5" />
    </>
  ),
  leo: (
    <>
      <circle cx="7.5" cy="15.5" r="3" />
      <path d="M10.5 15.5C10.5 11 9 9.5 9 7.5a4.3 4.3 0 0 1 8.6 0c0 4-4 7-4 10.5a2.2 2.2 0 0 0 4.4.2" />
    </>
  ),
  virgo: <path d="M3.5 5.5c1.5 0 2.3 1.2 2.3 3V19M5.8 9c0-2 1-3 2.4-3s2.4 1 2.4 3v10M10.6 9c0-2 1-3 2.4-3s2.4 1 2.4 3v6.5c0 3 1.5 5 4 5.5M15.4 13.5c2-1.5 5-.5 4.6 2.2c-.3 2.3-3 3.8-6.5 4.8" />,
  libra: <path d="M4 20h16M4 16.5h5a3.6 3.6 0 1 1 6 0h5" />,
  scorpio: <path d="M3.5 5.5c1.5 0 2.3 1.2 2.3 3V19M5.8 9c0-2 1-3 2.4-3s2.4 1 2.4 3v10M10.6 9c0-2 1-3 2.4-3s2.4 1 2.4 3v8.5c0 1.6.9 2.5 2.3 2.5H21M19 17.5l2 2.5l-2 2.2" />,
  sagittarius: <path d="M4.5 19.5L19.5 4.5M12 4.5h7.5V12M7.5 12l4.5 4.5" />,
  capricorn: <path d="M3.5 5.5l3.5 11l3.5-11v8.5c0 4 2.5 6.2 5.8 6.2a3.1 3.1 0 1 0 0-6.2c-3 0-4.4 3.2-6.6 6.2" />,
  aquarius: <path d="M3 10l3-2.2L9 10l3-2.2l3 2.2l3-2.2l3 2.2M3 16.2L6 14l3 2.2l3-2.2l3 2.2l3-2.2l3 2.2" />,
  pisces: <path d="M6 3c4.2 4.2 4.2 13.8 0 18M18 3c-4.2 4.2-4.2 13.8 0 18M4.5 12h15" />,
};

export function PlanetIcon({ planet, ...props }: IconProps & { planet: PlanetKey }) {
  return <Svg {...props}>{PLANET_PATHS[planet]}</Svg>;
}

export function SignIcon({ sign, ...props }: IconProps & { sign: SignKey }) {
  return <Svg {...props}>{SIGN_PATHS[sign]}</Svg>;
}

/** Ortak arayüz ikonları (yine aynı çizgi dilinde). */
export function SparkleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z" />
      <path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
    </Svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 12l16-8-6 16-2.5-6.5z" />
      <path d="M11.5 13.5L20 4" />
    </Svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
    </Svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </Svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}
