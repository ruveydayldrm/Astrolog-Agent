"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { PlanetIcon, SignIcon } from "@/components/icons/AstroIcons";
import { HOUSE_THEMES, PLANETS, SIGNS, type AspectKey, type PlanetKey } from "@/lib/astro/constants";
import type { NatalChart, NatalPlanet } from "@/lib/astro/chart";
import { formatPosition } from "@/lib/astro/format";

const SIZE = 600;
const C = SIZE / 2;
const R_OUTER = 292;
const R_SIGN_INNER = 250;
const R_PLANET = 212;
const R_HOUSE_INNER = 132;
const R_ASPECT = 128;

const ASPECT_STYLE: Record<AspectKey, { color: string; dash?: string } | null> = {
  conjunction: null, // kavuşum çizgiyle gösterilmez
  opposition: { color: "#f08ca8" },
  square: { color: "#f08ca8", dash: "4 4" },
  trine: { color: "#a994f5" },
  sextile: { color: "#a994f5", dash: "2 4" },
};

const PLANET_THEME = Object.fromEntries(PLANETS.map((p) => [p.key, p.theme])) as Record<PlanetKey, string>;

/**
 * İnteraktif doğum haritası çemberi.
 * Yönelim: yükselen solda (saat 9 yönü), boylam saat yönünün tersine artar.
 * Saat bilinmiyorsa 0° Koç solda olacak şekilde çizilir ve evler gösterilmez.
 */
export function ChartWheel({ chart }: { chart: NatalChart }) {
  const [active, setActive] = useState<PlanetKey | null>(null);
  const rotation = chart.ascendant?.longitude ?? 0;

  /** Ekliptik boylamı SVG koordinatına çevirir. */
  const point = (lon: number, r: number) => {
    const theta = ((180 + lon - rotation) * Math.PI) / 180;
    return { x: C + r * Math.cos(theta), y: C - r * Math.sin(theta) };
  };

  // Birbirine çok yakın gezegenleri görsel olarak ayır (min 8°)
  const placed = useMemo(() => spreadPlanets(chart.planets, 8), [chart.planets]);

  const activePlanet = chart.planets.find((p) => p.key === active) ?? null;
  const activeAspects = active ? chart.aspects.filter((a) => a.a === active || a.b === active) : [];

  return (
    <div className="relative mx-auto w-full max-w-[600px]">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full select-none" role="img" aria-label="Doğum haritası çemberi">
        <defs>
          <radialGradient id="wheel-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1A1440" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0B0B1F" stopOpacity="0.3" />
          </radialGradient>
        </defs>

        <circle cx={C} cy={C} r={R_OUTER} fill="url(#wheel-bg)" stroke="#D4AF37" strokeOpacity="0.5" strokeWidth="1" />
        <circle cx={C} cy={C} r={R_SIGN_INNER} fill="none" stroke="#D4AF37" strokeOpacity="0.35" />
        <circle cx={C} cy={C} r={R_HOUSE_INNER} fill="none" stroke="#c3c7d6" strokeOpacity="0.15" />

        {/* Burç dilimleri */}
        {SIGNS.map((s, i) => {
          const a = point(i * 30, R_OUTER);
          const b = point(i * 30, R_SIGN_INNER);
          const g = point(i * 30 + 15, (R_OUTER + R_SIGN_INNER) / 2);
          return (
            <g key={s.key}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#D4AF37" strokeOpacity="0.35" />
              <g transform={`translate(${g.x - 11} ${g.y - 11})`} className="text-gold-400">
                <SignIcon sign={s.key} className="h-[22px] w-[22px]" strokeWidth={1.3} title={s.name} />
              </g>
            </g>
          );
        })}

        {/* 5° derece çentikleri */}
        {Array.from({ length: 72 }, (_, i) => {
          const a = point(i * 5, R_SIGN_INNER);
          const b = point(i * 5, R_SIGN_INNER - (i % 2 === 0 ? 7 : 4));
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#c3c7d6" strokeOpacity="0.25" />;
        })}

        {/* Evler */}
        {chart.houses?.cusps.map((cusp, i) => {
          const isAngle = i % 3 === 0; // 1, 4, 7, 10
          const a = point(cusp.longitude, R_SIGN_INNER);
          const b = point(cusp.longitude, R_HOUSE_INNER);
          const next = chart.houses!.cusps[(i + 1) % 12]!.longitude;
          const mid = cusp.longitude + (((next - cusp.longitude + 360) % 360) / 2);
          const label = point(mid, R_HOUSE_INNER + 14);
          return (
            <g key={i}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={isAngle ? "#D4AF37" : "#c3c7d6"} strokeOpacity={isAngle ? 0.8 : 0.22} strokeWidth={isAngle ? 1.4 : 1} />
              <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="central" fontSize="11" fill="#8e93a8">
                {i + 1}
              </text>
            </g>
          );
        })}

        {/* ASC / MC etiketleri */}
        {chart.ascendant && (
          <AxisLabel {...point(chart.ascendant.longitude, R_OUTER + 0)} text="ASC" dx={-4} anchor="end" />
        )}
        {chart.midheaven && <AxisLabel {...point(chart.midheaven.longitude, R_OUTER)} text="MC" dy={-6} anchor="middle" />}

        {/* Açı çizgileri */}
        <g>
          {chart.aspects.map((asp, i) => {
            const style = ASPECT_STYLE[asp.type];
            const pa = chart.planets.find((p) => p.key === asp.a);
            const pb = chart.planets.find((p) => p.key === asp.b);
            if (!style || !pa || !pb) return null;
            const a = point(pa.longitude, R_ASPECT);
            const b = point(pb.longitude, R_ASPECT);
            const highlighted = active && (asp.a === active || asp.b === active);
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={style.color}
                strokeDasharray={style.dash}
                strokeWidth={highlighted ? 1.6 : 0.9}
                strokeOpacity={active ? (highlighted ? 0.95 : 0.08) : 0.45}
                style={{ transition: "stroke-opacity 200ms" }}
              />
            );
          })}
        </g>

        {/* Gezegenler */}
        {placed.map(({ planet, displayLon }) => {
          const g = point(displayLon, R_PLANET);
          const tick = point(planet.longitude, R_SIGN_INNER);
          const tickIn = point(planet.longitude, R_SIGN_INNER - 12);
          const isActive = active === planet.key;
          return (
            <g
              key={planet.key}
              tabIndex={0}
              role="button"
              aria-label={`${planet.name}: ${formatPosition(planet)}`}
              className="cursor-pointer outline-none"
              onMouseEnter={() => setActive(planet.key)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(planet.key)}
              onBlur={() => setActive(null)}
              onClick={() => setActive((k) => (k === planet.key ? null : planet.key))}
            >
              <line x1={tick.x} y1={tick.y} x2={tickIn.x} y2={tickIn.y} stroke="#ecd68f" strokeWidth="1.4" />
              <circle cx={g.x} cy={g.y} r="17" fill={isActive ? "rgba(212,175,55,0.18)" : "rgba(11,11,31,0.75)"} stroke="#D4AF37" strokeOpacity={isActive ? 0.9 : 0.3} />
              <g transform={`translate(${g.x - 11} ${g.y - 11})`} className={isActive ? "text-gold-300" : "text-silver-100"}>
                <PlanetIcon planet={planet.key} className="h-[22px] w-[22px]" strokeWidth={1.4} />
              </g>
              {planet.retrograde && (
                <text x={g.x + 15} y={g.y + 15} fontSize="10" fill="#f08ca8">
                  R
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip kartı */}
      <AnimatePresence>
        {activePlanet && (
          <motion.div
            key={activePlanet.key}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="glass pointer-events-none absolute left-1/2 top-1/2 w-60 -translate-x-1/2 -translate-y-1/2 rounded-2xl p-4 text-center"
          >
            <PlanetIcon planet={activePlanet.key} className="mx-auto h-6 w-6 text-gold-400" />
            <p className="mt-1 font-serif text-xl text-silver-100">{activePlanet.name}</p>
            <p className="text-sm text-gold-300">
              {formatPosition(activePlanet)}
              {activePlanet.retrograde && " · Retro"}
            </p>
            {activePlanet.house && <p className="text-xs text-silver-500">{activePlanet.house}. ev · {HOUSE_THEMES[activePlanet.house - 1]}</p>}
            <p className="mt-2 text-xs leading-relaxed text-silver-300">{PLANET_THEME[activePlanet.key]}</p>
            {activeAspects.length > 0 && <p className="mt-2 text-[11px] text-lilac-300">{activeAspects.length} açı</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AxisLabel({ x, y, text, dx = 0, dy = 0, anchor }: { x: number; y: number; text: string; dx?: number; dy?: number; anchor: "start" | "middle" | "end" }) {
  return (
    <text x={x + dx} y={y + dy} textAnchor={anchor} fontSize="11" letterSpacing="2" fill="#ecd68f" dominantBaseline="central">
      {text}
    </text>
  );
}

/**
 * Yakın gezegenleri çember üzerinde iterek üst üste binmeyi önler.
 * Gerçek konum kenardaki çentikle gösterilmeye devam eder.
 */
function spreadPlanets(planets: NatalPlanet[], minGap: number) {
  const sorted = [...planets].sort((a, b) => a.longitude - b.longitude).map((p) => ({ planet: p, displayLon: p.longitude }));
  for (let pass = 0; pass < 6; pass++) {
    for (let i = 0; i < sorted.length; i++) {
      const cur = sorted[i]!;
      const next = sorted[(i + 1) % sorted.length]!;
      const gap = (next.displayLon - cur.displayLon + 360) % 360;
      if (gap < minGap) {
        const push = (minGap - gap) / 2;
        cur.displayLon -= push;
        next.displayLon += push;
      }
    }
  }
  return sorted;
}
