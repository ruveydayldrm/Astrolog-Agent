import { natalAspects, transitAspects, type Aspect, type AspectPoint } from "./aspects";
import { computeHouses, houseOf, type HouseSystem } from "./houses";
import { planetPositions, toZodiac, type PlanetPosition, type ZodiacPosition } from "./positions";
import { localToUtc } from "./time";

export interface BirthData {
  /** "YYYY-MM-DD" */
  date: string;
  /** "HH:mm" ya da bilinmiyorsa null */
  time: string | null;
  latitude: number;
  longitude: number;
  timeZone: string;
  placeName?: string;
}

export interface NatalPlanet extends PlanetPosition {
  /** Doğum saati bilinmiyorsa null. */
  house: number | null;
}

export interface NatalChart {
  utc: string;
  timeKnown: boolean;
  planets: NatalPlanet[];
  /** Doğum saati bilinmiyorsa null. */
  ascendant: ZodiacPosition | null;
  midheaven: ZodiacPosition | null;
  houses: { system: HouseSystem; cusps: ZodiacPosition[] } | null;
  aspects: Aspect[];
}

export interface TransitSnapshot {
  utc: string;
  planets: PlanetPosition[];
  /** Transit gezegenlerin natal haritaya yaptığı açılar (Ay hariç — çok hızlı). */
  aspects: Aspect[];
  /** Transitlerin natal evlere göre konumu (saat biliniyorsa). */
  housePlacements: Partial<Record<PlanetPosition["key"], number>>;
}

/** Saf hesaplama: UTC an + konumdan doğum haritası. */
export function computeChartAt(utc: Date, lat: number, lon: number, timeKnown: boolean): NatalChart {
  const planets = planetPositions(utc);
  const houses = timeKnown ? computeHouses(utc, lat, lon) : null;

  const natalPlanets: NatalPlanet[] = planets.map((p) => ({
    ...p,
    house: houses ? houseOf(p.longitude, houses.cusps) : null,
  }));

  const points: AspectPoint[] = planets.map((p) => ({ key: p.key, longitude: p.longitude }));
  if (houses) {
    points.push({ key: "asc", longitude: houses.ascendant }, { key: "mc", longitude: houses.midheaven });
  }

  return {
    utc: utc.toISOString(),
    timeKnown,
    planets: natalPlanets,
    ascendant: houses ? toZodiac(houses.ascendant) : null,
    midheaven: houses ? toZodiac(houses.midheaven) : null,
    houses: houses ? { system: houses.system, cusps: houses.cusps.map(toZodiac) } : null,
    aspects: natalAspects(points),
  };
}

/** Kullanıcının doğum bilgisinden doğum haritası. */
export function computeNatalChart(birth: BirthData): NatalChart {
  const utc = localToUtc(birth.date, birth.time, birth.timeZone);
  return computeChartAt(utc, birth.latitude, birth.longitude, birth.time !== null);
}

/** Verilen an için transit gezegenler ve natal haritaya yaptıkları açılar. */
export function computeTransits(natal: NatalChart, at: Date = new Date()): TransitSnapshot {
  const planets = planetPositions(at);
  const transiting: AspectPoint[] = planets
    .filter((p) => p.key !== "moon")
    .map((p) => ({ key: p.key, longitude: p.longitude, speed: p.speed }));

  const natalPoints: AspectPoint[] = natal.planets.map((p) => ({ key: p.key, longitude: p.longitude }));
  if (natal.ascendant && natal.midheaven) {
    natalPoints.push({ key: "asc", longitude: natal.ascendant.longitude }, { key: "mc", longitude: natal.midheaven.longitude });
  }

  const housePlacements: TransitSnapshot["housePlacements"] = {};
  if (natal.houses) {
    const cusps = natal.houses.cusps.map((c) => c.longitude);
    for (const p of planets) housePlacements[p.key] = houseOf(p.longitude, cusps);
  }

  return { utc: at.toISOString(), planets, aspects: transitAspects(transiting, natalPoints), housePlacements };
}
