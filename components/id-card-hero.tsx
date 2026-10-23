"use client";

import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import type { PointerEvent } from "react";

type Props = { live: number; partners: number; campus: string };

// The one signature piece: a frosted intern ID that tilts toward your finger or cursor.
export function IdCardHero({ live, partners, campus }: Props) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 160, damping: 18, mass: 0.6 };
  const rotateY = useSpring(useTransform(px, [0, 1], [-14, 14]), spring);
  const rotateX = useSpring(useTransform(py, [0, 1], [10, -10]), spring);
  const shineX = useTransform(px, [0, 1], ["0%", "100%"]);
  const shineY = useTransform(py, [0, 1], ["0%", "100%"]);
  const shine = useMotionTemplate`radial-gradient(120% 80% at ${shineX} ${shineY}, rgb(255 255 255 / 0.55), transparent 55%)`;

  function move(e: PointerEvent<HTMLDivElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  }
  function leave() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <div className="relative mx-auto w-full max-w-[340px] sm:w-[340px] [perspective:900px]" onPointerMove={move} onPointerLeave={leave}>
      {/* lanyard */}
      <div aria-hidden className="mx-auto h-10 w-8 rounded-b-md bg-gradient-to-b from-nu-blue/0 to-nu-blue/70" />
      <motion.div
        style={reduce ? undefined : { rotateX, rotateY }}
        // no opacity in the entrance: the card must be visible in the server HTML before JS loads
        initial={reduce ? false : { y: -18, rotateZ: -5 }}
        animate={{ y: 0, rotateZ: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.1 }}
        className="glass-strong relative aspect-[1.58/1] w-full overflow-hidden rounded-[26px] p-5"
      >
        <span aria-hidden className="absolute left-1/2 top-3 h-1.5 w-12 -translate-x-1/2 rounded-full bg-ink/15" />
        {!reduce && <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: shine }} />}
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-medium text-ink-soft">{campus} intern</span>
            <span aria-hidden className="h-7 w-10 rounded-md bg-gradient-to-br from-nu-gold to-nu-gold/60" />
          </div>
          <div className="flex items-end gap-6">
            <p>
              <span className="tabular block text-5xl font-semibold tracking-tight">{live}</span>
              <span className="text-sm text-ink-soft">leads</span>
            </p>
            <p>
              <span className="tabular block text-5xl font-semibold tracking-tight text-nu-blue dark:text-nu-gold">{partners}</span>
              <span className="text-sm text-ink-soft">HTE partners</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
