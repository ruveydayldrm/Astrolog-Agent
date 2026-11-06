import { ASPECTS, LUMINARY_ORB_BONUS, POINT_NAMES, type AspectKey, type PointKey } from "./constants";
import { angularDistance } from "./math";

export interface AspectPoint {
  key: PointKey;
  longitude: number;
  speed?: number;
}

export interface Aspect {
  a: PointKey;
  b: PointKey;
  aName: string;
  bName: string;
  type: AspectKey;
  typeName: string;
  /** Kesin açıdan sapma (derece). */
  orb: number;
  /** Transitlerde: açı yaklaşıyor mu (true) yoksa ayrılıyor mu (false)? */
  applying?: boolean;
}

/** İki boylam arasındaki açıyı, verilen orb fonksiyonuna göre bulur. */
function matchAspect(lonA: number, lonB: number, orbFor: (a: (typeof ASPECTS)[number]) => number) {
  const dist = angularDistance(lonA, lonB);
  let best: { aspect: (typeof ASPECTS)[number]; orb: number } | null = null;
  for (const aspect of ASPECTS) {
    const orb = Math.abs(dist - aspect.angle);
    if (orb <= orbFor(aspect) && (!best || orb < best.orb)) best = { aspect, orb };
  }
  return best;
}

const isLuminary = (k: PointKey) => k === "sun" || k === "moon";

/** Doğum haritası içi açılar (her nokta çifti bir kez). */
export function natalAspects(points: AspectPoint[]): Aspect[] {
  const result: Aspect[] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const p = points[i]!;
      const q = points[j]!;
      // ASC-MC arasındaki açı anlamlı değil
      if ((p.key === "asc" && q.key === "mc") || (p.key === "mc" && q.key === "asc")) continue;
      const bonus = isLuminary(p.key) || isLuminary(q.key) ? LUMINARY_ORB_BONUS : 0;
      const m = matchAspect(p.longitude, q.longitude, (a) => a.orb + bonus);
      if (m) result.push(buildAspect(p.key, q.key, m.aspect, m.orb));
    }
  }
  return result.sort((x, y) => x.orb - y.orb);
}

/**
 * Transit gezegenlerin natal noktalara yaptığı açılar.
 * Yaklaşma/ayrılma, transit gezegenin hızına göre bir saat sonraki orb ile belirlenir.
 */
export function transitAspects(transiting: AspectPoint[], natal: AspectPoint[]): Aspect[] {
  const result: Aspect[] = [];
  for (const t of transiting) {
    for (const n of natal) {
      const m = matchAspect(t.longitude, n.longitude, (a) => a.transitOrb);
      if (!m) continue;
      const step = (t.speed ?? 0) / 24; // 1 saatlik hareket
      const futureOrb = Math.abs(angularDistance(t.longitude + step, n.longitude) - m.aspect.angle);
      result.push({ ...buildAspect(t.key, n.key, m.aspect, m.orb), applying: futureOrb < m.orb });
    }
  }
  return result.sort((x, y) => x.orb - y.orb);
}

function buildAspect(a: PointKey, b: PointKey, aspect: (typeof ASPECTS)[number], orb: number): Aspect {
  return {
    a,
    b,
    aName: POINT_NAMES[a],
    bName: POINT_NAMES[b],
    type: aspect.key,
    typeName: aspect.name,
    orb: Math.round(orb * 100) / 100,
  };
}
