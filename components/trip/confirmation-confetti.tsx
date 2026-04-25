"use client";

import { motion } from "framer-motion";

const COLORS = ["#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

// Deterministic pseudo-random so we don't violate the purity rule.
function frac(n: number): number {
  const v = Math.sin(n * 43.1337) * 91349.1771;
  return v - Math.floor(v);
}

const PIECES = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  x: frac(i + 1) * 100,
  delay: frac(i + 100) * 0.3,
  rotate: frac(i + 200) * 360,
  color: COLORS[i % COLORS.length],
}));

export function ConfirmationConfetti() {
  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {PIECES.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -40, x: `${p.x}vw`, rotate: 0, opacity: 1 }}
          animate={{ y: "105vh", rotate: p.rotate + 360, opacity: 0 }}
          transition={{ duration: 2.2, delay: p.delay, ease: "easeIn" }}
          className="absolute h-2 w-2 rounded-sm"
          style={{ backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}
