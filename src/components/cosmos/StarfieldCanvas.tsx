"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  twinkleSpeed: number;
  phase: number;
  /** Paralaks hızı — uzak yıldızlar daha yavaş kayar. */
  drift: number;
  hue: "white" | "gold" | "lilac";
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

const COLORS = { white: "238,240,246", gold: "236,214,143", lilac: "201,187,255" } as const;

/**
 * Tam ekran yıldız alanı.
 * Performans: tek canvas, DPR sınırı 2, alan başına yıldız yoğunluğu, sekme gizliyken durur,
 * "hareketi azalt" tercihinde tek kare statik çizer.
 */
export function StarfieldCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stars: Star[] = [];
    let shooting: ShootingStar | null = null;
    let nextShootingAt = performance.now() + 4000 + Math.random() * 6000;
    let width = 0;
    let height = 0;
    let raf = 0;
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // ~1 yıldız / 4500 px², üst sınır 320
      const count = Math.min(320, Math.floor((width * height) / 4500));
      stars = Array.from({ length: count }, () => {
        const roll = Math.random();
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() < 0.08 ? 1.3 + Math.random() * 0.7 : 0.4 + Math.random() * 0.8,
          baseAlpha: 0.35 + Math.random() * 0.55,
          twinkleSpeed: 0.4 + Math.random() * 1.4,
          phase: Math.random() * Math.PI * 2,
          drift: 0.6 + Math.random() * 2.4,
          hue: roll < 0.08 ? "gold" : roll < 0.18 ? "lilac" : "white",
        };
      });
    };

    const spawnShootingStar = () => {
      const fromLeft = Math.random() < 0.5;
      const speed = 0.7 + Math.random() * 0.5; // px/ms
      const angle = (Math.PI / 180) * (20 + Math.random() * 20);
      shooting = {
        x: fromLeft ? Math.random() * width * 0.5 : width * 0.5 + Math.random() * width * 0.5,
        y: Math.random() * height * 0.4,
        vx: (fromLeft ? 1 : -1) * Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 900 + Math.random() * 500,
      };
    };

    const draw = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;
      const t = now / 1000;
      ctx.clearRect(0, 0, width, height);

      for (const s of stars) {
        if (!reduceMotion) {
          s.y -= (s.drift * dt) / 1000; // yavaşça yukarı süzülür
          if (s.y < -2) s.y = height + 2;
        }
        const alpha = reduceMotion ? s.baseAlpha : s.baseAlpha * (0.65 + 0.35 * Math.sin(t * s.twinkleSpeed + s.phase));
        ctx.beginPath();
        ctx.fillStyle = `rgba(${COLORS[s.hue]},${alpha.toFixed(3)})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.r > 1.2) {
          // Parlak yıldızlara hafif hale
          ctx.beginPath();
          ctx.fillStyle = `rgba(${COLORS[s.hue]},${(alpha * 0.12).toFixed(3)})`;
          ctx.arc(s.x, s.y, s.r * 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!reduceMotion) {
        if (!shooting && now > nextShootingAt) spawnShootingStar();
        if (shooting) {
          const sh: ShootingStar = shooting;
          sh.life += dt;
          sh.x += sh.vx * dt;
          sh.y += sh.vy * dt;
          const p = sh.life / sh.maxLife;
          const fade = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;
          const tailX = sh.x - sh.vx * 160;
          const tailY = sh.y - sh.vy * 160;
          const grad = ctx.createLinearGradient(sh.x, sh.y, tailX, tailY);
          grad.addColorStop(0, `rgba(255,248,220,${(0.9 * fade).toFixed(3)})`);
          grad.addColorStop(1, "rgba(255,248,220,0)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.4;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(sh.x, sh.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();
          if (sh.life >= sh.maxLife) {
            shooting = null;
            nextShootingAt = now + 7000 + Math.random() * 9000;
          }
        }
        raf = requestAnimationFrame(draw);
      }
    };

    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduceMotion) {
        last = performance.now();
        raf = requestAnimationFrame(draw);
      }
    };

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0" />;
}
