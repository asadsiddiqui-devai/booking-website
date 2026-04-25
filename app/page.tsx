"use client";

import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  animate,
  type MotionValue,
} from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";
import {
  Plane,
  Building2,
  Car,
  ArrowRight,
  Sparkles,
  Globe,
  Shield,
  Clock,
  Star,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { HeroSearch } from "@/components/landing/hero-search";
import { Button } from "@/components/ui/button";

/* ── Data ──────────────────────────────────────────── */

const FEATURED = [
  {
    city: "Tokyo",
    country: "Japan",
    iata: "HND",
    tag: "Culture & Cuisine",
    img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=900&q=80&auto=format&fit=crop",
  },
  {
    city: "Paris",
    country: "France",
    iata: "CDG",
    tag: "Romance & Art",
    img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=700&q=80&auto=format&fit=crop",
  },
  {
    city: "Dubai",
    country: "UAE",
    iata: "DXB",
    tag: "Luxury & Skyline",
    img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=700&q=80&auto=format&fit=crop",
  },
  {
    city: "New York",
    country: "USA",
    iata: "JFK",
    tag: "The City That Never Sleeps",
    img: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=700&q=80&auto=format&fit=crop",
  },
  {
    city: "London",
    country: "UK",
    iata: "LHR",
    tag: "History & Style",
    img: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=700&q=80&auto=format&fit=crop",
  },
  {
    city: "Sydney",
    country: "Australia",
    iata: "SYD",
    tag: "Harbour & Adventure",
    img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=700&q=80&auto=format&fit=crop",
  },
];

const STATS = [
  { value: 450, suffix: "+", label: "Destinations", sub: "Worldwide" },
  { value: 50, suffix: "+", label: "Airlines", sub: "Partners" },
  { value: 1, suffix: "M+", label: "Travelers", sub: "Happy customers" },
  { value: 24, suffix: "/7", label: "Support", sub: "Always available" },
];

const HOW_IT_WORKS = [
  {
    icon: Plane,
    title: "Search your flight",
    body: "Real airline inventory, live seat availability, and cabin classes via Duffel.",
    step: "01",
    gradient: "from-blue-500/20 to-indigo-500/10",
    glow: "group-hover:shadow-blue-500/20",
    accentColor: "oklch(0.52 0.17 232)",
  },
  {
    icon: Building2,
    title: "Pick your hotel",
    body: "Ranked by rating, amenities, and distance to city center. Instant confirmation.",
    step: "02",
    gradient: "from-amber-500/20 to-orange-500/10",
    glow: "group-hover:shadow-amber-500/20",
    accentColor: "oklch(0.72 0.15 75)",
  },
  {
    icon: Car,
    title: "Grab a rental car",
    body: "Real providers, transparent pricing, all categories from economy to luxury.",
    step: "03",
    gradient: "from-emerald-500/20 to-teal-500/10",
    glow: "group-hover:shadow-emerald-500/20",
    accentColor: "oklch(0.6 0.18 165)",
  },
];

const TESTIMONIALS = [
  {
    quote: "Booked our entire honeymoon — flights, hotel, and a convertible — in under 10 minutes.",
    author: "Sophia M.",
    role: "Frequent traveler",
    stars: 5,
  },
  {
    quote: "The best travel booking experience I've ever had. Clean, fast, and actually enjoyable.",
    author: "James T.",
    role: "Business traveler",
    stars: 5,
  },
  {
    quote: "Finally a site that doesn't feel like it was designed in 2005. Love the new look.",
    author: "Aria L.",
    role: "Digital nomad",
    stars: 5,
  },
];

/* ── Animation variants ────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.06 } },
};

const depthReveal = {
  hidden: {
    opacity: 0,
    rotateX: 14,
    y: 40,
    scale: 0.95,
    filter: "blur(6px)",
  },
  show: {
    opacity: 1,
    rotateX: 0,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const staggerDepth = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.16, delayChildren: 0.1 },
  },
};

/* ── Animated stat counter ──────────────────────── */

function StatCounter({ value, suffix }: { value: number; suffix: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const triggered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          const controls = animate(0, value, {
            duration: 1.8,
            ease: [0.22, 1, 0.36, 1],
            onUpdate: (v) => setDisplay(Math.round(v)),
          });
          return () => controls.stop();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

/* ── Mouse-tracking 3D tilt hook ───────────────── */

function useTilt(strength = 12) {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(rawY, { stiffness: 300, damping: 30 });
  const rotateY = useSpring(rawX, { stiffness: 300, damping: 30 });

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      rawX.set(dx * strength);
      rawY.set(-dy * strength);
    },
    [rawX, rawY, strength]
  );

  const onMouseLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  return { ref, rotateX, rotateY, onMouseMove, onMouseLeave };
}

/* ── 3D Destination card ────────────────────────── */

function DestCard({
  d,
  index,
}: {
  d: (typeof FEATURED)[0];
  index: number;
}) {
  const isFeatured = index === 0;
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-1, 1], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-1, 1], [-10, 10]), { stiffness: 300, damping: 30 });
  /* Inner parallax layer moves opposite → depth illusion */
  const layerX = useTransform(mouseX, [-1, 1], ["-8px", "8px"]);
  const layerY = useTransform(mouseY, [-1, 1], ["8px", "-8px"]);
  const textX = useTransform(mouseX, [-1, 1], ["-4px", "4px"]);
  const textY = useTransform(mouseY, [-1, 1], ["4px", "-4px"]);

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
      mouseY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
    },
    [mouseX, mouseY]
  );

  const handleLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotateX: 12, y: 24 }}
      whileInView={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.75, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={isFeatured ? "col-span-2 md:col-span-1 md:row-span-2" : ""}
      style={{ perspective: 900, transformStyle: "preserve-3d" }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="h-full"
      >
        <Link
          href={`/search/flights?destination=${d.iata}`}
          className={[
            "sheen group relative flex flex-col justify-end overflow-hidden rounded-3xl p-6 text-white bg-slate-900 cursor-pointer block h-full",
            isFeatured ? "min-h-[280px] md:min-h-[420px]" : "h-44 md:h-48",
          ].join(" ")}
        >
          {/* Background image with parallax shift */}
          <motion.div
            style={{ x: layerX, y: layerY, scale: 1.12 }}
            className="absolute inset-0 pointer-events-none"
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${d.img})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </motion.div>

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors duration-500" />

          {/* Bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/75 to-transparent" />
          {/* Top fade */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/35 to-transparent" />

          {/* Glow ring on hover */}
          <div className="absolute inset-0 rounded-3xl ring-1 ring-white/0 group-hover:ring-white/15 transition-all duration-500" />

          {/* Tag badge — floats forward in Z */}
          <motion.div
            style={{ x: textX, y: textY, translateZ: 30 }}
            className="absolute top-4 left-4 z-10"
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-black/35 backdrop-blur-md px-2.5 py-1 text-[10px] font-medium text-white/90 border border-white/10">
              <MapPin className="h-2.5 w-2.5" />
              {d.tag}
            </span>
          </motion.div>

          {/* Text content — floats most forward */}
          <motion.div
            style={{ x: textX, y: textY, translateZ: 40 }}
            className="relative z-10"
          >
            <div className="text-[9px] uppercase tracking-[0.25em] opacity-60 mb-0.5">
              {d.country}
            </div>
            <div
              className={[
                "font-display font-bold tracking-tight leading-none",
                isFeatured ? "text-4xl sm:text-5xl" : "text-2xl",
              ].join(" ")}
            >
              {d.city}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-350">
              <span>Search flights</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </motion.div>
        </Link>
      </motion.div>
    </motion.div>
  );
}

/* ── 3D Testimonial card ────────────────────────── */

function TestimonialCard({
  t,
  index,
}: {
  t: (typeof TESTIMONIALS)[0];
  index: number;
}) {
  const { ref, rotateX, rotateY, onMouseMove, onMouseLeave } = useTilt(8);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, rotateX: 10 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 800 }}
    >
      <motion.div
        ref={ref}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" as const }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="group rounded-3xl border bg-card p-7 hover:border-primary/25 cursor-default
          transition-shadow duration-400
          hover:shadow-[0_24px_64px_-8px_oklch(0_0_0/0.15),0_0_0_1px_oklch(0.52_0.17_232/0.08)]
          dark:hover:shadow-[0_24px_64px_-8px_oklch(0_0_0/0.5),0_0_40px_-8px_oklch(0.65_0.16_232/0.15)]"
      >
        {/* Floating inner highlight */}
        <div
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 30% 20%, oklch(0.52 0.17 232 / 0.06), transparent 60%)",
          }}
        />

        <motion.div style={{ translateZ: 20 }} className="relative">
          <div className="flex gap-0.5 mb-4">
            {Array.from({ length: t.stars }).map((_, s) => (
              <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-sm leading-relaxed text-foreground/80 mb-5 italic">
            &ldquo;{t.quote}&rdquo;
          </p>
          <div>
            <div className="font-semibold text-sm">{t.author}</div>
            <div className="text-xs text-muted-foreground">{t.role}</div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* ── Page ──────────────────────────────────────── */

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });

  /* Parallax transforms */
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const orbY1 = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const orbY2 = useTransform(scrollYProgress, [0, 1], ["0%", "-15%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  /* Hero 3D orb scroll response */
  const orbRotateX = useTransform(scrollYProgress, [0, 1], [0, -25]);
  const orbRotateY = useTransform(scrollYProgress, [0, 1], [0, 15]);
  const orbScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.85]);

  /* Mouse parallax for hero orb */
  const heroMouseX = useMotionValue(0);
  const heroMouseY = useMotionValue(0);
  const orbSpringX = useSpring(heroMouseX, { stiffness: 60, damping: 20 });
  const orbSpringY = useSpring(heroMouseY, { stiffness: 60, damping: 20 });

  const handleHeroMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      heroMouseX.set(((e.clientX - rect.left) / rect.width - 0.5) * 20);
      heroMouseY.set(((e.clientY - rect.top) / rect.height - 0.5) * -20);
    },
    [heroMouseX, heroMouseY]
  );

  return (
    <div className="overflow-x-hidden">

      {/* ═══════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        className="relative flex min-h-[95vh] flex-col items-center justify-center overflow-hidden px-4 py-28"
      >
        {/* ─ Parallax background image ─ */}
        <motion.div
          style={{ y: bgY }}
          className="pointer-events-none absolute inset-0 -z-20"
        >
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `url("https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1800&q=60&auto=format&fit=crop")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "saturate(0) contrast(1.2)",
            }}
          />
        </motion.div>

        {/* ─ Aurora orbs ─ */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            className="absolute -top-1/3 -left-1/4 h-[800px] w-[800px] rounded-full blur-[140px] animate-aurora-1"
            style={{
              y: orbY1,
              background: "radial-gradient(circle, oklch(0.52 0.17 232 / 0.25), transparent 68%)",
            }}
          />
          <motion.div
            className="absolute -bottom-1/4 -right-1/3 h-[700px] w-[700px] rounded-full blur-[120px] animate-aurora-2"
            style={{
              y: orbY2,
              background: "radial-gradient(circle, oklch(0.55 0.22 260 / 0.18), transparent 68%)",
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full blur-[90px] animate-aurora-3"
            style={{ background: "radial-gradient(circle, oklch(0.72 0.15 75 / 0.12), transparent 70%)" }}
          />
          {/* Rotating rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full border border-primary/8 animate-rotate-slow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full border border-primary/5 animate-spin-reverse" />
          {/* Extra ring for depth */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[750px] w-[750px] rounded-full border border-gold/4 animate-rotate-slow" style={{ animationDuration: "55s", animationDirection: "reverse" }} />
        </div>

        {/* ─ Floating 3D orb (scroll + mouse reactive) ─ */}
        <motion.div
          style={{
            rotateX: orbRotateX,
            rotateY: orbRotateY,
            scale: orbScale,
            x: orbSpringX,
            y: orbSpringY,
            transformStyle: "preserve-3d",
          }}
          className="pointer-events-none absolute right-[8%] top-[18%] hidden lg:block"
          aria-hidden
        >
          <motion.div
            animate={{ y: [-8, 8, -8], rotateZ: [0, 5, 0, -5, 0] }}
            transition={{ duration: 9, ease: "easeInOut", repeat: Infinity }}
            className="orb-3d h-48 w-48"
            style={{
              background: "radial-gradient(circle at 35% 35%, oklch(0.75 0.18 240 / 0.6), oklch(0.52 0.17 232 / 0.3) 45%, oklch(0.55 0.22 260 / 0.15) 70%, transparent 90%)",
              boxShadow: "0 0 60px -10px oklch(0.52 0.17 232 / 0.4), inset 0 0 40px oklch(1 0 0 / 0.08)",
            }}
          />
        </motion.div>

        {/* Second smaller orb */}
        <motion.div
          style={{ x: useTransform(orbSpringX, (v) => -v * 0.6), y: useTransform(orbSpringY, (v) => -v * 0.6) }}
          className="pointer-events-none absolute left-[6%] bottom-[22%] hidden lg:block"
          aria-hidden
        >
          <motion.div
            animate={{ y: [6, -6, 6], rotateZ: [0, -4, 0, 4, 0] }}
            transition={{ duration: 11, ease: "easeInOut", repeat: Infinity, delay: 2 }}
            className="orb-3d h-28 w-28"
            style={{
              background: "radial-gradient(circle at 40% 30%, oklch(0.85 0.12 80 / 0.5), oklch(0.72 0.15 75 / 0.25) 50%, transparent 80%)",
              boxShadow: "0 0 40px -8px oklch(0.72 0.15 75 / 0.35)",
            }}
          />
        </motion.div>

        {/* ─ Dot grid ─ */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage: `radial-gradient(circle, oklch(0.5 0.02 265 / 0.10) 1px, transparent 1px)`,
            backgroundSize: "36px 36px",
          }}
        />
        {/* Vignette */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background: "radial-gradient(ellipse 75% 65% at center, transparent, var(--background) 92%)",
          }}
        />

        {/* ─ Hero content ─ */}
        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className="relative z-10 w-full max-w-5xl text-center"
        >
          <motion.div variants={stagger} initial="hidden" animate="show">
            {/* Badge */}
            <motion.div variants={fadeUp} className="mb-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-5 py-2 text-xs font-semibold text-primary backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Flights · Hotels · Cars — seamlessly in one trip
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="font-display text-5xl font-bold leading-[1.04] tracking-tight sm:text-7xl md:text-[5.5rem] lg:text-[6.5rem]"
            >
              Discover the world,
              <br />
              <span className="text-gradient-aurora">your way.</span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              variants={fadeUp}
              className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg leading-relaxed"
            >
              Search real airline inventory, find hotels near the city center,
              and add a rental car — all tied to one seamless trip.
            </motion.p>

            {/* Search widget */}
            <motion.div variants={fadeUp} className="mt-12 w-full">
              <HeroSearch />
            </motion.div>

            {/* Trust badges */}
            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground"
            >
              {[
                { icon: Shield, text: "Secure booking" },
                { icon: Clock, text: "Real-time availability" },
                { icon: Sparkles, text: "Best price guarantee" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {text}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ─ Scroll indicator ─ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        >
          <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground/50">Scroll</span>
          <div className="h-8 w-px bg-gradient-to-b from-primary/50 to-transparent animate-scroll-bounce" />
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════
          STATS
      ═══════════════════════════════════════════════ */}
      <section className="relative border-y border-border/50 bg-muted/20 py-12 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: "linear-gradient(to right, var(--background), transparent 20%, transparent 80%, var(--background))",
          }}
        />
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 24, rotateX: 12 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
                className="group text-center cursor-default"
                style={{ perspective: 600 }}
              >
                <div className="font-display text-3xl font-bold sm:text-4xl text-gradient-gold overflow-hidden">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 + 0.15 }}
                  >
                    <StatCounter value={stat.value} suffix={stat.suffix} />
                  </motion.div>
                </div>
                <div className="mt-1 text-sm font-medium text-foreground">{stat.label}</div>
                <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  {stat.sub}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-4 py-28" style={{ perspective: "1200px" }}>
        <motion.div
          initial={{ opacity: 0, y: 22, rotateX: 8 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-16 text-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          <span className="inline-block rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-primary font-semibold mb-4">
            Process
          </span>
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Book your trip in
            <span className="text-gradient-gold"> 3 steps</span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            Everything you need for a seamless journey — from takeoff to check-in.
          </p>
        </motion.div>

        <div className="relative grid gap-6 md:grid-cols-3">
          {/* Connector line */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden
            className="absolute top-10 left-[calc(16.67%+2.5rem)] right-[calc(16.67%+2.5rem)] h-px hidden md:block origin-left"
            style={{
              background: "linear-gradient(to right, oklch(0.52 0.17 232 / 0.2), var(--primary), oklch(0.52 0.17 232 / 0.2))",
            }}
          />

          {HOW_IT_WORKS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40, rotateX: 16, scale: 0.94 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.75, delay: i * 0.18, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.div
                whileHover={{
                  y: -10,
                  rotateX: -4,
                  rotateY: i === 0 ? 4 : i === 2 ? -4 : 0,
                  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                }}
                className={[
                  "sheen group relative flex flex-col rounded-3xl border bg-card p-8 cursor-default",
                  "hover:border-primary/30",
                  `hover:shadow-xl ${step.glow}`,
                  "transition-shadow duration-400",
                ].join(" ")}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Background gradient orb */}
                <div
                  className={`pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                {/* Depth highlight */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(ellipse at 20% 20%, ${step.accentColor.replace(")", " / 0.08)")}, transparent 55%)`,
                  }}
                />

                <motion.div
                  style={{ translateZ: 20 }}
                  className="relative mb-6 flex items-center justify-between"
                >
                  <div
                    className={[
                      "inline-flex h-14 w-14 items-center justify-center rounded-2xl",
                      "bg-primary/10 text-primary",
                      "transition-all duration-400 group-hover:bg-primary group-hover:text-primary-foreground",
                      "group-hover:scale-110 group-hover:rotate-[-6deg] group-hover:shadow-lg",
                    ].join(" ")}
                  >
                    <step.icon className="h-6 w-6" />
                  </div>
                  <span className="font-display text-6xl font-bold text-muted-foreground/12 select-none leading-none">
                    {step.step}
                  </span>
                </motion.div>

                <motion.div style={{ translateZ: 16 }} className="relative">
                  <h3 className="font-display text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          DESTINATIONS
      ═══════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-4 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 22, rotateX: 8 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 flex items-end justify-between"
          style={{ perspective: 800 }}
        >
          <div>
            <span className="inline-block rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-primary font-semibold mb-4">
              Explore
            </span>
            <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Popular destinations
            </h2>
          </div>
          <Link
            href="/search/flights"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors duration-200 group cursor-pointer"
          >
            Browse all
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        {/* Destination grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {FEATURED.map((d, i) => (
            <DestCard key={d.iata} d={d} index={i} />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════ */}
      <section className="relative py-24 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, var(--background), oklch(0.95 0.015 232 / 0.3), var(--background))",
          }}
        />
        <div className="dark:hidden pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(to bottom, transparent, oklch(0.93 0.015 232 / 0.2), transparent)" }}
        />

        <div className="relative mx-auto max-w-6xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 22, rotateX: 8 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
            style={{ perspective: 800 }}
          >
            <span className="inline-block rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-primary font-semibold mb-4">
              Reviews
            </span>
            <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Loved by travelers
            </h2>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-3" style={{ perspective: "1200px" }}>
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={t.author} t={t} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          REQUEST SHORTCUTS
      ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-20 px-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, var(--background), oklch(0.94 0.018 232 / 0.25), var(--background))",
          }}
        />
        <div className="relative mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 22, rotateX: 8 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-10"
            style={{ perspective: 800 }}
          >
            <span className="inline-block rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-primary font-semibold mb-4">
              For employees
            </span>
            <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Submit a request
            </h2>
            <p className="mt-2 text-muted-foreground max-w-md">
              Send your travel or accommodation preferences directly to the booking team.
            </p>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2" style={{ perspective: "1200px" }}>
            {[
              {
                href: "/travel-request",
                icon: Plane,
                title: "Travel request",
                body: "Add one or more flights. Review the itinerary, then email it to the travel agent.",
                cta: "Start travel request",
                orb: "from-indigo-500/25 to-violet-500/15",
                iconBg: "group-hover:bg-indigo-500",
                tiltDir: 3,
              },
              {
                href: "/hotel-request",
                icon: Building2,
                title: "Hotel request",
                body: "Pick a city, dates, meals, and airport transfers. Send to the hotel booking team.",
                cta: "Start hotel request",
                orb: "from-amber-500/25 to-orange-500/15",
                iconBg: "group-hover:bg-amber-500",
                tiltDir: -3,
              },
            ].map((card, i) => (
              <motion.div
                key={card.href}
                initial={{ opacity: 0, y: 32, rotateX: 12, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.14, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <motion.div
                  whileHover={{
                    y: -8,
                    rotateX: -3,
                    rotateY: card.tiltDir,
                    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                  }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <Link
                    href={card.href}
                    className="sheen group relative flex flex-col overflow-hidden rounded-3xl border bg-card p-8 transition-all duration-350 hover:border-primary/30 hover:shadow-xl cursor-pointer block"
                  >
                    <div
                      aria-hidden
                      className={`pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br ${card.orb} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    />
                    <motion.div style={{ translateZ: 20 }} className="relative flex items-start gap-4 mb-5">
                      <div
                        className={[
                          "inline-flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl",
                          "bg-primary/10 text-primary",
                          "transition-all duration-350",
                          card.iconBg,
                          "group-hover:text-white group-hover:scale-110",
                        ].join(" ")}
                      >
                        <card.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display text-xl font-bold">{card.title}</div>
                        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                          {card.body}
                        </p>
                      </div>
                    </motion.div>
                    <motion.div style={{ translateZ: 16 }} className="relative inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all duration-200">
                      {card.cta}
                      <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </motion.div>
                  </Link>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CTA
      ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-32 px-4">
        {/* Radial aurora */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 70% 60% at 50% 50%, oklch(0.52 0.17 232 / 0.12), transparent)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 40% 40% at 60% 40%, oklch(0.72 0.15 75 / 0.08), transparent)",
          }}
        />
        {/* Grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, oklch(0.5 0.02 265 / 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, oklch(0.5 0.02 265 / 0.05) 1px, transparent 1px)
            `,
            backgroundSize: "52px 52px",
          }}
        />
        {/* Floating icons */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <Plane
            className="absolute top-[15%] left-[8%] h-8 w-8 text-primary/10 animate-float"
            style={{ animationDelay: "0s" }}
          />
          <Building2
            className="absolute top-[20%] right-[10%] h-6 w-6 text-primary/10 animate-float-delayed"
            style={{ animationDelay: "1.5s" }}
          />
          <Car
            className="absolute bottom-[20%] left-[12%] h-7 w-7 text-primary/8 animate-float"
            style={{ animationDelay: "3s" }}
          />
          <Globe
            className="absolute bottom-[15%] right-[8%] h-9 w-9 text-primary/8 animate-float-delayed"
            style={{ animationDelay: "0.8s" }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: 12 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto max-w-2xl text-center"
          style={{ perspective: 800 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-5 py-2 text-xs font-semibold text-primary mb-7">
            <Globe className="h-3.5 w-3.5" />
            Your next adventure awaits
          </span>

          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Ready to
            <br />
            <span className="text-gradient-aurora">explore?</span>
          </h2>

          <p className="mt-5 text-muted-foreground leading-relaxed text-base sm:text-lg">
            Start planning your next trip — flights, hotels, and cars
            in one seamless, beautiful flow.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/search/flights">
              <Button
                size="lg"
                className="gap-2 rounded-full px-10 py-6 text-base shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/30 cursor-pointer"
              >
                <Plane className="h-4 w-4" />
                Search flights
              </Button>
            </Link>
            <Link href="/trips">
              <button className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-background px-9 text-sm font-semibold hover:bg-accent hover:border-primary/30 transition-all duration-300 hover:scale-105 cursor-pointer">
                My trips
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
