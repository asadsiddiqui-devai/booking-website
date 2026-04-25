"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plane, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { href: "/search/flights", label: "Flights" },
  { href: "/search/hotels", label: "Hotels" },
  { href: "/search/cars", label: "Cars" },
  { href: "/trips", label: "My trips" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={[
          "fixed top-0 inset-x-0 z-50 transition-all duration-500",
          scrolled
            ? "glass-strong shadow-lg border-b border-white/20"
            : "bg-transparent border-b border-transparent",
        ].join(" ")}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl blur-md bg-primary/30 transition-all duration-500 group-hover:blur-lg group-hover:scale-110 group-hover:bg-primary/50" />
              <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md transition-all duration-400 group-hover:rotate-[-8deg] group-hover:scale-110">
                <Plane className="h-4 w-4 animate-plane-fly" />
              </span>
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="font-display text-base font-bold tracking-wide">Wanderly</span>
              <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground leading-none">
                Travel &amp; Booking
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer",
                    active
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  ].join(" ")}
                >
                  {link.label}
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-primary/10 -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent transition-colors cursor-pointer"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                {mobileOpen ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <X className="h-4 w-4" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Menu className="h-4 w-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed right-0 top-0 bottom-0 z-50 w-72 glass-strong border-l border-white/20 px-6 pt-20 pb-8 md:hidden"
            >
              <nav className="flex flex-col gap-1">
                {NAV_LINKS.map((link, i) => {
                  const active = pathname === link.href;
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={[
                          "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium",
                          "transition-all duration-200 cursor-pointer",
                          active
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-accent text-muted-foreground hover:text-foreground",
                        ].join(" ")}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Push content below fixed navbar */}
      <div className="h-16" aria-hidden />
    </>
  );
}
