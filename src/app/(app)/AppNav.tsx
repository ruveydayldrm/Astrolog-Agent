"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { PlanetIcon, SparkleIcon } from "@/components/icons/AstroIcons";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/panel", label: "Panel", icon: <PlanetIcon planet="sun" className="h-5 w-5" /> },
  { href: "/harita", label: "Haritam", icon: <PlanetIcon planet="saturn" className="h-5 w-5" /> },
  { href: "/sohbet", label: "Lyra", icon: <SparkleIcon className="h-5 w-5" /> },
  { href: "/ayarlar", label: "Ayarlar", icon: <PlanetIcon planet="moon" className="h-5 w-5" /> },
];

/** Masaüstünde üst menü, mobilde alt sekme çubuğu. */
export function AppNav({ variant }: { variant: "top" | "bottom" }) {
  const path = usePathname();
  const active = (href: string) => path === href || path.startsWith(`${href}/`);

  if (variant === "top") {
    return (
      <nav className="hidden items-center gap-1 md:flex" aria-label="Ana menü">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative rounded-full px-4 py-2 text-sm transition-colors",
              active(item.href) ? "text-gold-300" : "text-silver-300 hover:text-silver-100",
            )}
          >
            {active(item.href) && (
              <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full border border-gold-500/30 bg-gold-500/10" />
            )}
            <span className="relative">{item.label}</span>
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Ana menü"
      className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-3xl border border-gold-500/20 bg-night-800/80 p-1.5 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
    >
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] transition-colors",
            active(item.href) ? "bg-gold-500/10 text-gold-300" : "text-silver-500",
          )}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
