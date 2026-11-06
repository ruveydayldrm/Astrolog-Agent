import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { StarfieldCanvas } from "@/components/cosmos/StarfieldCanvas";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Lyra — Kişisel Astroloğun", template: "%s · Lyra" },
  description: "Doğum haritanı gerçek astronomik hesaplamayla çıkaran ve seni hatırlayan yapay zekâ destekli kişisel astrolog.",
};

export const viewport: Viewport = {
  themeColor: "#0B0B1F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="min-h-dvh">
        <StarfieldCanvas />
        <div className="relative z-10 flex min-h-dvh flex-col">{children}</div>
      </body>
    </html>
  );
}
