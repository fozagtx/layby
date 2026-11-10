import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { NetworkBadge } from "@/components/network-badge";
import { OfflineBar } from "@/components/offline-bar";
import { BrickMark } from "@/components/brick-mark";
import { SmoothScroll } from "@/components/smooth-scroll";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({ variable: "--font-instrument-serif", weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://laybyapp.vercel.app"),
  title: { default: "Layby", template: "%s · Layby" },
  description: "Reserve it today, pay it off in NIM, take it home when it's paid. Layaway for local shops inside Nimiq Pay.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f1ea",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <SmoothScroll>
        <OfflineBar />
        <div className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col px-5">
          <header className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-2" aria-label="Layby home">
              <BrickMark />
              <span className="font-display text-display-m">Layby</span>
            </Link>
            <NetworkBadge />
          </header>
          <main className="page-enter flex-1 pb-16">{children}</main>
          <footer className="dotted py-5 text-caption text-ink-muted">
            Payments go straight to the shop&apos;s wallet. We never hold money.{" "}
            <Link href="/how" className="underline underline-offset-2">
              How it works
            </Link>
          </footer>
        </div>
        </SmoothScroll>
      </body>
    </html>
  );
}
