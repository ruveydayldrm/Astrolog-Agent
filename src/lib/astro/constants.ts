/**
 * Astrolojik sabitler: burçlar, gezegenler, açılar ve Türkçe karşılıkları.
 * UI ve prompt metinleri bu tek kaynaktan beslenir.
 */

export const SIGNS = [
  { key: "aries", name: "Koç", element: "Ateş", modality: "Öncü" },
  { key: "taurus", name: "Boğa", element: "Toprak", modality: "Sabit" },
  { key: "gemini", name: "İkizler", element: "Hava", modality: "Değişken" },
  { key: "cancer", name: "Yengeç", element: "Su", modality: "Öncü" },
  { key: "leo", name: "Aslan", element: "Ateş", modality: "Sabit" },
  { key: "virgo", name: "Başak", element: "Toprak", modality: "Değişken" },
  { key: "libra", name: "Terazi", element: "Hava", modality: "Öncü" },
  { key: "scorpio", name: "Akrep", element: "Su", modality: "Sabit" },
  { key: "sagittarius", name: "Yay", element: "Ateş", modality: "Değişken" },
  { key: "capricorn", name: "Oğlak", element: "Toprak", modality: "Öncü" },
  { key: "aquarius", name: "Kova", element: "Hava", modality: "Sabit" },
  { key: "pisces", name: "Balık", element: "Su", modality: "Değişken" },
] as const;

export type SignKey = (typeof SIGNS)[number]["key"];

export const PLANETS = [
  { key: "sun", name: "Güneş", body: "Sun", theme: "Kimlik, yaşam gücü ve kendini ifade etme biçimin." },
  { key: "moon", name: "Ay", body: "Moon", theme: "Duyguların, iç dünyan ve güvende hissetme ihtiyacın." },
  { key: "mercury", name: "Merkür", body: "Mercury", theme: "Düşünme, öğrenme ve iletişim tarzın." },
  { key: "venus", name: "Venüs", body: "Venus", theme: "Sevgi dilin, estetik zevkin ve değer verdiklerin." },
  { key: "mars", name: "Mars", body: "Mars", theme: "Arzuların, cesaretin ve harekete geçme şeklin." },
  { key: "jupiter", name: "Jüpiter", body: "Jupiter", theme: "Büyüme, şans ve anlam arayışın." },
  { key: "saturn", name: "Satürn", body: "Saturn", theme: "Sorumluluk, sınırlar ve zamanla olgunlaşan yanların." },
  { key: "uranus", name: "Uranüs", body: "Uranus", theme: "Özgürlük, yenilik ve beklenmedik dönüşümler." },
  { key: "neptune", name: "Neptün", body: "Neptune", theme: "Hayaller, sezgi ve sınırların çözüldüğü alanlar." },
  { key: "pluto", name: "Plüton", body: "Pluto", theme: "Derin dönüşüm, güç ve yeniden doğuş." },
] as const;

export type PlanetKey = (typeof PLANETS)[number]["key"];

/** Haritadaki açı hesaplarına dahil edilen noktalar (gezegenler + açılar). */
export type PointKey = PlanetKey | "asc" | "mc";

export const POINT_NAMES: Record<PointKey, string> = {
  ...(Object.fromEntries(PLANETS.map((p) => [p.key, p.name])) as Record<PlanetKey, string>),
  asc: "Yükselen",
  mc: "Tepe Noktası (MC)",
};

export const ASPECTS = [
  { key: "conjunction", name: "Kavuşum", angle: 0, orb: 8, transitOrb: 3, symbol: "☌" },
  { key: "opposition", name: "Karşıt", angle: 180, orb: 8, transitOrb: 3, symbol: "☍" },
  { key: "trine", name: "Üçgen", angle: 120, orb: 7, transitOrb: 3, symbol: "△" },
  { key: "square", name: "Kare", angle: 90, orb: 7, transitOrb: 3, symbol: "□" },
  { key: "sextile", name: "Altmışlık", angle: 60, orb: 5, transitOrb: 2, symbol: "⚹" },
] as const;

export type AspectKey = (typeof ASPECTS)[number]["key"];

/** Güneş ve Ay için natal orblara eklenen pay. */
export const LUMINARY_ORB_BONUS = 2;

/** Placidus bu enlemin üzerinde tanımsızlaşır; Whole Sign'a geçilir. */
export const PLACIDUS_MAX_LATITUDE = 66;

export const HOUSE_THEMES: string[] = [
  "Benlik, beden ve dünyaya ilk izlenim",
  "Para, kaynaklar ve öz değer",
  "İletişim, kardeşler ve yakın çevre",
  "Ev, aile ve kökler",
  "Yaratıcılık, aşk ve keyif",
  "Günlük rutin, iş ve sağlık",
  "İlişkiler ve ortaklıklar",
  "Dönüşüm, paylaşılan kaynaklar ve yakınlık",
  "İnançlar, yolculuklar ve yüksek öğrenim",
  "Kariyer, hedefler ve toplumsal rol",
  "Arkadaşlıklar, topluluklar ve gelecek umutları",
  "Bilinçaltı, içe dönüş ve ruhsal arayış",
];
