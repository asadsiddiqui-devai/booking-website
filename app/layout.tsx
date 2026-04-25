import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar/navbar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wanderly — Book flights, hotels, and cars in one trip",
  description:
    "Plan and book your whole trip in one place: flights, hotels, and rental cars.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="relative border-t border-border/50 overflow-hidden">
            {/* Subtle aurora background */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background: "radial-gradient(ellipse 60% 80% at 20% 50%, oklch(0.52 0.17 232 / 0.04), transparent), radial-gradient(ellipse 50% 60% at 80% 50%, oklch(0.72 0.15 75 / 0.03), transparent)",
              }}
            />

            <div className="relative mx-auto max-w-6xl px-4 py-16">
              <div className="grid gap-10 md:grid-cols-4">
                {/* Brand */}
                <div className="md:col-span-2">
                  <p className="font-display text-2xl font-bold tracking-wide mb-3">
                    Wanderly
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                    Plan and book your whole trip in one place — flights, hotels, and rental cars seamlessly.
                  </p>
                  <p className="mt-4 text-[11px] text-muted-foreground/60 leading-relaxed">
                    Demo app — real airline &amp; hotel inventory via Duffel sandbox.
                    Bookings are simulated (no real tickets, no real charges).
                  </p>
                </div>

                {/* Links */}
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-muted-foreground mb-4">Book</p>
                  <ul className="space-y-2.5">
                    {["Flights", "Hotels", "Cars", "My trips"].map((item) => (
                      <li key={item}>
                        <a
                          href={`/search/${item.toLowerCase().replace(" ", "-")}`}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                        >
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-muted-foreground mb-4">Requests</p>
                  <ul className="space-y-2.5">
                    {["Travel request", "Hotel request"].map((item) => (
                      <li key={item}>
                        <a
                          href={`/${item.toLowerCase().replace(" ", "-")}`}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                        >
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="mt-12 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-[11px] text-muted-foreground/60">
                  © 2025 Wanderly. All rights reserved.
                </p>
                <p className="text-[11px] font-display tracking-[0.25em] uppercase text-muted-foreground/40">
                  WANDERLY
                </p>
              </div>
            </div>
          </footer>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
