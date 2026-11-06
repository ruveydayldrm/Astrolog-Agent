import * as Astronomy from "astronomy-engine";
import { PLACIDUS_MAX_LATITUDE } from "./constants";
import { acosd, asind, atan2d, cosd, norm360, sind, tand } from "./math";

export type HouseSystem = "placidus" | "whole-sign";

export interface HouseResult {
  system: HouseSystem;
  /** 12 ev başlangıcının ekliptik boylamları; index 0 = 1. ev. */
  cusps: number[];
  ascendant: number;
  midheaven: number;
}

/** Gerçek eğim (obliquity of date), derece. */
export function trueObliquity(date: Date): number {
  return Astronomy.e_tilt(Astronomy.MakeTime(date)).tobl;
}

/** Yerel yıldız zamanı derece cinsinden (RAMC). Doğu boylamları pozitif. */
export function ramc(date: Date, longitude: number): number {
  return norm360(Astronomy.SiderealTime(date) * 15 + longitude);
}

/** Ekvatoral sağ açıklıktan (RA) ekliptik üzerindeki noktanın boylamına. */
function raToEclipticLongitude(ra: number, eps: number): number {
  return norm360(atan2d(sind(ra), cosd(ra) * cosd(eps)));
}

export function midheaven(ramcDeg: number, eps: number): number {
  return raToEclipticLongitude(ramcDeg, eps);
}

export function ascendant(ramcDeg: number, eps: number, lat: number): number {
  return norm360(atan2d(cosd(ramcDeg), -(sind(ramcDeg) * cosd(eps) + tand(lat) * sind(eps))));
}

/**
 * Placidus ara ev başlangıcı (11, 12, 2, 3).
 * Ekliptik noktası, günlük yayının (semi-diurnal arc) belirli bir oranına
 * ulaştığında ev başlangıcı olur; denklem iteratif olarak çözülür.
 *
 * @param offset  RAMC'ye eklenen sabit (0 veya 180-ilişkili terimler)
 * @param factor  yayın oranı (1/3, 2/3)
 * @param nocturnal true ise gece yayı (2. ve 3. evler)
 */
function placidusCusp(ramcDeg: number, eps: number, lat: number, house: 11 | 12 | 2 | 3): number {
  // İlk tahmin: eşit ev bölünmesi
  const initial: Record<typeof house, number> = { 11: 30, 12: 60, 2: 120, 3: 150 };
  let ra = norm360(ramcDeg + initial[house]);

  for (let i = 0; i < 50; i++) {
    const lon = raToEclipticLongitude(ra, eps);
    const dec = asind(sind(eps) * sind(lon));
    const x = -tand(lat) * tand(dec);
    if (x < -1 || x > 1) throw new Error("PLACIDUS_UNDEFINED");
    const sda = acosd(x); // gündüz yarı yayı
    const next = (() => {
      switch (house) {
        case 11: return ramcDeg + sda / 3;
        case 12: return ramcDeg + (2 * sda) / 3;
        case 2: return ramcDeg + 60 + (2 * sda) / 3; // = RAMC + SDA + SNA/3
        case 3: return ramcDeg + 120 + sda / 3; // = RAMC + SDA + 2·SNA/3
      }
    })();
    const nextNorm = norm360(next);
    if (Math.abs(nextNorm - ra) < 1e-7) {
      ra = nextNorm;
      break;
    }
    ra = nextNorm;
  }
  return raToEclipticLongitude(ra, eps);
}

/** Whole Sign: yükselenin burcu 1. ev, her burç bir ev. */
function wholeSignCusps(asc: number): number[] {
  const start = Math.floor(asc / 30) * 30;
  return Array.from({ length: 12 }, (_, i) => norm360(start + i * 30));
}

/**
 * Ev başlangıçlarını hesaplar. Placidus, |enlem| ≥ 66° ise (veya matematiksel
 * olarak tanımsızsa) otomatik olarak Whole Sign'a düşer.
 */
export function computeHouses(date: Date, lat: number, lon: number): HouseResult {
  const eps = trueObliquity(date);
  const r = ramc(date, lon);
  const asc = ascendant(r, eps, lat);
  const mc = midheaven(r, eps);

  if (Math.abs(lat) < PLACIDUS_MAX_LATITUDE) {
    try {
      const c11 = placidusCusp(r, eps, lat, 11);
      const c12 = placidusCusp(r, eps, lat, 12);
      const c2 = placidusCusp(r, eps, lat, 2);
      const c3 = placidusCusp(r, eps, lat, 3);
      const cusps = [asc, c2, c3, mc + 180, c11 + 180, c12 + 180, asc + 180, c2 + 180, c3 + 180, mc, c11, c12].map(norm360);
      return { system: "placidus", cusps, ascendant: asc, midheaven: mc };
    } catch {
      // Whole Sign'a düş
    }
  }
  return { system: "whole-sign", cusps: wholeSignCusps(asc), ascendant: asc, midheaven: mc };
}

/** Bir boylamın hangi evde olduğunu (1–12) bulur. */
export function houseOf(longitude: number, cusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const start = cusps[i]!;
    const end = cusps[(i + 1) % 12]!;
    const span = norm360(end - start);
    if (norm360(longitude - start) < span) return i + 1;
  }
  return 1;
}
