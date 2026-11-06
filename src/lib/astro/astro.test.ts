import { describe, expect, it } from "vitest";
import {
  computeChartAt,
  computeNatalChart,
  computeTransits,
  formatDegree,
  houseOf,
  localToUtc,
  natalAspects,
  planetPositions,
} from "./index";
import { angularDistance } from "./math";

/** Beklenen boylama (derece) belirli tolerans içinde yakın mı? */
function expectLon(actual: number, expected: number, tol: number) {
  expect(angularDistance(actual, expected)).toBeLessThan(tol);
}

describe("gezegen konumları", () => {
  it("2024 ilkbahar ekinoksunda Güneş 0° Koç'tadır", () => {
    const sun = planetPositions(new Date("2024-03-20T03:06:00Z")).find((p) => p.key === "sun")!;
    expectLon(sun.longitude, 0, 0.02);
  });

  it("2024 yaz gündönümünde Güneş 0° Yengeç'tedir", () => {
    const sun = planetPositions(new Date("2024-06-20T20:51:00Z")).find((p) => p.key === "sun")!;
    expectLon(sun.longitude, 90, 0.02);
    expect(sun.signName).toBe("Yengeç");
  });

  it("Merkür 2024-04-10 civarında retrodur", () => {
    const mercury = planetPositions(new Date("2024-04-10T12:00:00Z")).find((p) => p.key === "mercury")!;
    expect(mercury.retrograde).toBe(true);
  });
});

/**
 * Albert Einstein — 14 Mart 1879, 11:30 LMT, Ulm (48°24′K, 9°59′D) → 10:50 UT.
 * Referans değerler Astrodienst (astro.com, Placidus) haritasından.
 */
describe("Einstein doğum haritası", () => {
  const chart = computeChartAt(new Date("1879-03-14T10:50:00Z"), 48.4, 9.983, true);
  const lon = (k: string) => chart.planets.find((p) => p.key === k)!.longitude;

  it.each([
    ["sun", 353.5], // 23°30′ Balık
    ["moon", 254.52], // 14°31′ Yay
    ["mercury", 3.13], // 3°08′ Koç
    ["venus", 16.98], // 16°59′ Koç
    ["mars", 296.92], // 26°55′ Oğlak
    ["jupiter", 327.48], // 27°29′ Kova
    ["saturn", 4.18], // 4°11′ Koç
    ["uranus", 151.28], // 1°17′ Başak
    ["neptune", 37.87], // 7°52′ Boğa
    ["pluto", 54.73], // 24°44′ Boğa
  ])("%s konumu doğru", (key, expected) => {
    expectLon(lon(key), expected, 0.5);
  });

  it("Uranüs retrodur", () => {
    expect(chart.planets.find((p) => p.key === "uranus")!.retrograde).toBe(true);
  });

  it("yükselen ~11°38′ Yengeç, MC ~12°50′ Balık", () => {
    expectLon(chart.ascendant!.longitude, 101.63, 1);
    expectLon(chart.midheaven!.longitude, 342.83, 1);
    expect(chart.ascendant!.signName).toBe("Yengeç");
  });

  it("Placidus kullanılır; 1. ev = ASC, 10. ev = MC, başlangıçlar sıralıdır", () => {
    const cusps = chart.houses!.cusps.map((c) => c.longitude);
    expect(chart.houses!.system).toBe("placidus");
    expectLon(cusps[0]!, chart.ascendant!.longitude, 1e-6);
    expectLon(cusps[9]!, chart.midheaven!.longitude, 1e-6);
    // Her ev bir öncekinden ileride olmalı (0 < genişlik < 180)
    for (let i = 0; i < 12; i++) {
      const width = (cusps[(i + 1) % 12]! - cusps[i]! + 360) % 360;
      expect(width).toBeGreaterThan(0);
      expect(width).toBeLessThan(180);
    }
  });

  it("Güneş 10. evde, Ay 6. evdedir", () => {
    expect(chart.planets.find((p) => p.key === "sun")!.house).toBe(10);
    expect(chart.planets.find((p) => p.key === "moon")!.house).toBe(6);
  });

  it("Merkür–Satürn kavuşumu bulunur; orbu aşan Güneş–Satürn (10°41′) bulunmaz", () => {
    const has = (a: string, b: string, type: string) =>
      chart.aspects.some((x) => ((x.a === a && x.b === b) || (x.a === b && x.b === a)) && x.type === type);
    expect(has("mercury", "saturn", "conjunction")).toBe(true);
    expect(has("sun", "saturn", "conjunction")).toBe(false);
  });
});

describe("saat bilinmiyorsa", () => {
  const chart = computeNatalChart({ date: "1990-05-15", time: null, latitude: 41.01, longitude: 28.98, timeZone: "Europe/Istanbul" });

  it("yükselen, MC ve evler hesaplanmaz", () => {
    expect(chart.timeKnown).toBe(false);
    expect(chart.ascendant).toBeNull();
    expect(chart.houses).toBeNull();
    expect(chart.planets.every((p) => p.house === null)).toBe(true);
  });

  it("açılarda ASC/MC yer almaz", () => {
    expect(chart.aspects.every((a) => !["asc", "mc"].includes(a.a) && !["asc", "mc"].includes(a.b))).toBe(true);
  });
});

describe("yüksek enlem", () => {
  it("Tromsø'de (69.6°K) Whole Sign'a düşer", () => {
    const chart = computeChartAt(new Date("2000-01-01T12:00:00Z"), 69.65, 18.96, true);
    expect(chart.houses!.system).toBe("whole-sign");
    expect(chart.houses!.cusps[0]!.degreeInSign).toBe(0);
  });
});

describe("saat dilimi dönüşümü", () => {
  it("İstanbul 2010 yazı EEST (+3)", () => {
    expect(localToUtc("2010-07-01", "12:00", "Europe/Istanbul").toISOString()).toBe("2010-07-01T09:00:00.000Z");
  });
  it("İstanbul 2010 kışı EET (+2)", () => {
    expect(localToUtc("2010-01-01", "12:00", "Europe/Istanbul").toISOString()).toBe("2010-01-01T10:00:00.000Z");
  });
  it("İstanbul 2020 kışı sabit +3", () => {
    expect(localToUtc("2020-01-01", "12:00", "Europe/Istanbul").toISOString()).toBe("2020-01-01T09:00:00.000Z");
  });
});

describe("yardımcılar", () => {
  it("houseOf 0° geçişini doğru ele alır", () => {
    const cusps = [350, 20, 50, 80, 110, 140, 170, 200, 230, 260, 290, 320];
    expect(houseOf(355, cusps)).toBe(1);
    expect(houseOf(5, cusps)).toBe(1);
    expect(houseOf(25, cusps)).toBe(2);
    expect(houseOf(345, cusps)).toBe(12);
  });

  it("açı tespiti ve orb", () => {
    const aspects = natalAspects([
      { key: "sun", longitude: 10 },
      { key: "mars", longitude: 101 },
      { key: "venus", longitude: 250 },
    ]);
    expect(aspects.find((a) => a.a === "sun" && a.b === "mars")).toMatchObject({ type: "square", orb: 1 });
    expect(aspects.find((a) => a.a === "sun" && a.b === "venus")).toMatchObject({ type: "trine", orb: 0 });
  });

  it("formatDegree yuvarlamayı doğru yapar", () => {
    expect(formatDegree(23.5)).toBe("23°30′");
    expect(formatDegree(4.9999)).toBe("5°00′");
  });

  it("transitler Ay'ı açılardan hariç tutar", () => {
    const natal = computeChartAt(new Date("1990-01-01T12:00:00Z"), 41, 29, true);
    const t = computeTransits(natal, new Date("2026-11-06T12:00:00Z"));
    expect(t.aspects.every((a) => a.a !== "moon")).toBe(true);
    expect(Object.keys(t.housePlacements)).toHaveLength(10);
  });
});
