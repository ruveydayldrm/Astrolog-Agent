import * as Astronomy from "astronomy-engine";
import { PLANETS, SIGNS, type PlanetKey, type SignKey } from "./constants";
import { norm360 } from "./math";

export interface ZodiacPosition {
  /** Tropikal ekliptik boylam, derece [0, 360). */
  longitude: number;
  sign: SignKey;
  signName: string;
  /** Burç içindeki derece [0, 30). */
  degreeInSign: number;
}

export interface PlanetPosition extends ZodiacPosition {
  key: PlanetKey;
  name: string;
  /** Günlük hareket (derece/gün). Negatifse gezegen geri harekettedir. */
  speed: number;
  retrograde: boolean;
}

/** Boylamı burç + derece bilgisine çevirir. */
export function toZodiac(longitude: number): ZodiacPosition {
  const lon = norm360(longitude);
  const index = Math.floor(lon / 30) % 12;
  const sign = SIGNS[index]!;
  return { longitude: lon, sign: sign.key, signName: sign.name, degreeInSign: lon - index * 30 };
}

/**
 * Bir gök cisminin verilen andaki jeosantrik, görünür, tropikal ekliptik boylamı.
 * Ekliptik "tarihin gerçek ekliptiği"dir (presesyon + nütasyon dahil) — tropikal zodyakla uyumlu.
 */
export function eclipticLongitude(body: Astronomy.Body, date: Date): number {
  if (body === Astronomy.Body.Sun) return norm360(Astronomy.SunPosition(date).elon);
  if (body === Astronomy.Body.Moon) return norm360(Astronomy.EclipticGeoMoon(date).lon);
  const vec = Astronomy.GeoVector(body, date, true);
  return norm360(Astronomy.Ecliptic(vec).elon);
}

const HALF_DAY_MS = 12 * 60 * 60 * 1000;

/** Tüm gezegenlerin konumu, hızı ve retro durumu. */
export function planetPositions(date: Date): PlanetPosition[] {
  const before = new Date(date.getTime() - HALF_DAY_MS);
  const after = new Date(date.getTime() + HALF_DAY_MS);

  return PLANETS.map((p) => {
    const body = Astronomy.Body[p.body];
    const lon = eclipticLongitude(body, date);
    // Merkezi fark: 1 günlük aralıkta boylam değişimi (360° geçişini düzelterek)
    let delta = eclipticLongitude(body, after) - eclipticLongitude(body, before);
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    return {
      key: p.key,
      name: p.name,
      ...toZodiac(lon),
      speed: delta,
      retrograde: delta < 0,
    };
  });
}
