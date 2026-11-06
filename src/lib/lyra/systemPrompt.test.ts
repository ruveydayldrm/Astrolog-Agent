import { describe, expect, it } from "vitest";
import { computeChartAt, computeTransits, natalChartToPrompt, transitsToPrompt } from "../astro";
import { fillSystemPrompt, LYRA_SYSTEM_PROMPT } from "./systemPrompt";

describe("sistem promptu", () => {
  it("tüm yer tutucular doldurulur", () => {
    const natal = computeChartAt(new Date("1995-08-20T07:30:00Z"), 38.42, 27.14, true);
    const prompt = fillSystemPrompt({
      DOGUM_HARITASI: natalChartToPrompt(natal, { name: "Deniz", birthDate: "1995-08-20", birthTime: "10:30", place: "İzmir" }),
      BUGUNUN_TARIHI: "6 Kasım 2026",
      GUNCEL_TRANSITLER: transitsToPrompt(computeTransits(natal, new Date("2026-11-06T09:00:00Z"))),
      KULLANICI_HAFIZASI: "- İzmir'de yaşıyor",
    });
    expect(prompt).not.toMatch(/\{\{[A-Z_]+\}\}/);
    expect(prompt).toContain('<guncel_transitler tarih="6 Kasım 2026">');
    expect(prompt).toContain("Yükselen:");
    expect(prompt).toContain("Güneş: ");
  });

  it("saat bilinmiyorsa prompt bunu açıkça belirtir", () => {
    const natal = computeChartAt(new Date("1995-08-20T09:00:00Z"), 38.42, 27.14, false);
    const text = natalChartToPrompt(natal, { name: "Deniz", birthDate: "1995-08-20", birthTime: null, place: "İzmir" });
    expect(text).toContain("Doğum saati BİLİNMİYOR");
    expect(text).not.toContain("Yükselen:");
  });

  it("şablonda tam olarak dört yer tutucu vardır", () => {
    const keys = new Set([...LYRA_SYSTEM_PROMPT.matchAll(/\{\{([A-Z_]+)\}\}/g)].map((m) => m[1]));
    expect([...keys].sort()).toEqual(["BUGUNUN_TARIHI", "DOGUM_HARITASI", "GUNCEL_TRANSITLER", "KULLANICI_HAFIZASI"]);
  });
});
