/** Derece tabanlı küçük trigonometri yardımcıları. */

export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;

/** Açıyı [0, 360) aralığına getirir. */
export function norm360(x: number): number {
  const r = x % 360;
  return r < 0 ? r + 360 : r;
}

export const sind = (x: number) => Math.sin(x * DEG);
export const cosd = (x: number) => Math.cos(x * DEG);
export const tand = (x: number) => Math.tan(x * DEG);
export const atan2d = (y: number, x: number) => Math.atan2(y, x) * RAD;
export const asind = (x: number) => Math.asin(x) * RAD;
export const acosd = (x: number) => Math.acos(x) * RAD;

/** İki ekliptik boylam arasındaki en kısa açısal mesafe [0, 180]. */
export function angularDistance(a: number, b: number): number {
  const d = Math.abs(norm360(a - b));
  return d > 180 ? 360 - d : d;
}
