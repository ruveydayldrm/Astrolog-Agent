import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

/** Cam efektli kart. */
export function GlassCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass rounded-3xl p-6 sm:p-8", className)} {...props} />;
}

type ButtonVariant = "gold" | "ghost" | "subtle" | "danger";

const VARIANTS: Record<ButtonVariant, string> = {
  gold:
    "bg-gradient-to-b from-gold-400 to-gold-600 text-night-900 font-semibold shadow-glow hover:brightness-110 active:brightness-95",
  ghost: "border border-gold-500/40 text-gold-300 hover:bg-gold-500/10 hover:border-gold-500/70",
  subtle: "text-silver-300 hover:text-silver-100 hover:bg-white/5",
  danger: "border border-rose-400/40 text-rose-400 hover:bg-rose-400/10",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm tracking-wide transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400";

export const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }>(
  function Button({ className, variant = "gold", ...props }, ref) {
    return <button ref={ref} className={cn(BASE, VARIANTS[variant], className)} {...props} />;
  },
);

export function ButtonLink({ className, variant = "gold", ...props }: React.ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return <Link className={cn(BASE, VARIANTS[variant], className)} {...props} />;
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-2xl border border-white/10 bg-night-900/60 px-4 py-3 text-silver-100 placeholder:text-silver-500",
        "outline-none transition focus:border-gold-500/60 focus:ring-2 focus:ring-gold-500/20",
        "[color-scheme:dark]",
        className,
      )}
      {...props}
    />
  );
});

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-silver-300", className)} {...props} />;
}

/** Nazik hata/uyarı kutusu. */
export function Notice({ tone = "error", children, className }: { tone?: "error" | "info"; children: React.ReactNode; className?: string }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        tone === "error" ? "border-rose-400/30 bg-rose-400/10 text-rose-100" : "border-lilac-400/30 bg-lilac-400/10 text-lilac-200",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-xs font-medium uppercase tracking-[0.3em] text-gold-400/90", className)}>{children}</p>;
}
