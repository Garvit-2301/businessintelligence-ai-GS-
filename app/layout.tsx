import { AppShell } from "@/components/app-shell";
import { PersonaProvider } from "@/components/persona-provider";
import type { Metadata } from "next";
import { Geist, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
});

const ibm = IBM_Plex_Mono({
  variable: "--font-ibm",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Lithub — KPI intelligence to action",
  description:
    "Round 2 prototype: a KPI intelligence-to-action engine that detects material movements, ranks drivers, writes persona-specific briefs, abstains under contradiction, and recommends owned actions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${instrument.variable} ${ibm.variable} antialiased`}>
        <PersonaProvider>
          <AppShell>{children}</AppShell>
        </PersonaProvider>
      </body>
    </html>
  );
}
