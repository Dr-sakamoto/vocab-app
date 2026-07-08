"use client";

import { ReactNode, useRef, CSSProperties } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * マウス位置に応じてカードが3D傾斜し、光沢（グレア）がついてくる問題カード用ラッパー。
 * /preview/dramatic のTiltCardを本番向けに引き算したもの：傾きは±6°に抑え、
 * タッチ端末（mousemoveが来ない環境）ではただの静的カードとして振る舞う。
 * prefers-reduced-motion時は傾斜・グレアとも無効。
 */
export default function TiltCard({ children, className, style }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(y, [0, 1], [6, -6]), {
    stiffness: 220,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(x, [0, 1], [-6, 6]), {
    stiffness: 220,
    damping: 20,
  });
  const glareX = useTransform(x, [0, 1], ["15%", "85%"]);
  const glareY = useTransform(y, [0, 1], ["15%", "85%"]);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.28), transparent 55%)`;

  if (reduceMotion) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        x.set((e.clientX - rect.left) / rect.width);
        y.set((e.clientY - rect.top) / rect.height);
      }}
      onMouseLeave={() => {
        x.set(0.5);
        y.set(0.5);
      }}
      style={{ ...style, rotateX, rotateY, transformPerspective: 900 }}
      className={className}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 z-10"
        style={{ background: glare }}
        aria-hidden
      />
      {children}
    </motion.div>
  );
}
