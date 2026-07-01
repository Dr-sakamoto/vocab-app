"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring, useScroll, useTransform } from "framer-motion";

const Scene3D = dynamic(() => import("./Scene3D"), { ssr: false });
const SnowMountainScene = dynamic(() => import("./SnowMountainScene"), { ssr: false });

type BiomeId = "vortex" | "snow";

const BIOMES: Record<BiomeId, { label: string; tagline: string }> = {
  vortex: { label: "アブストラクト・ヴォルテックス", tagline: "Tier 1 ・ 序盤エリアのイメージ" },
  snow: { label: "雪山", tagline: "Tier 3 ・ 出題プールが伸びた先のエリアのイメージ" },
};

function TiltCard({
  title,
  desc,
  accent,
}: {
  title: string;
  desc: string;
  accent: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(y, [0, 1], [16, -16]), { stiffness: 200, damping: 18 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-16, 16]), { stiffness: 200, damping: 18 });
  const glowX = useTransform(x, [0, 1], ["0%", "100%"]);
  const glowY = useTransform(y, [0, 1], ["0%", "100%"]);
  const background = useMotionTemplate`radial-gradient(circle at ${glowX} ${glowY}, ${accent}55, transparent 60%)`;

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
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      whileHover={{ scale: 1.04 }}
      className="glass-panel-dark relative overflow-hidden rounded-3xl border border-white/10 p-6 shadow-2xl"
    >
      <motion.div className="pointer-events-none absolute inset-0" style={{ background }} />
      <div className="relative z-10">
        <div
          className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl text-2xl font-black"
          style={{ background: accent, boxShadow: `0 0 30px ${accent}` }}
        >
          ✦
        </div>
        <h3 className="font-display text-xl font-bold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/60">{desc}</p>
      </div>
    </motion.div>
  );
}

export default function DramaticPreviewPage() {
  const [biome, setBiome] = useState<BiomeId>("vortex");
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 0.85]);

  const cursorX = useMotionValue(-200);
  const cursorY = useMotionValue(-200);
  const cursorXSpring = useSpring(cursorX, { stiffness: 120, damping: 20 });
  const cursorYSpring = useSpring(cursorY, { stiffness: 120, damping: 20 });

  return (
    <div
      ref={containerRef}
      onMouseMove={(e) => {
        cursorX.set(e.clientX - 200);
        cursorY.set(e.clientY - 200);
      }}
      className="relative min-h-screen shrink-0 bg-[#0b0620] text-white"
    >
      {/* カーソルを追いかける光の玉 */}
      <motion.div
        className="pointer-events-none fixed z-0 h-[400px] w-[400px] rounded-full opacity-30 blur-[100px]"
        style={{
          left: cursorXSpring,
          top: cursorYSpring,
          background: "radial-gradient(circle, #a855f7, transparent 70%)",
        }}
      />

      {/* 戻る導線（このページがデモであることを明示） */}
      <div className="fixed top-4 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
        <Link
          href="/"
          className="glass-panel-dark flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur-md transition hover:text-white"
        >
          ← アプリ本体に戻る（これはデザインプレビューです）
        </Link>

        {/* バイオーム切り替え：進捗によって背景が変わるイメージのデモ */}
        <div className="glass-panel-dark flex items-center gap-1 rounded-full border border-white/10 p-1">
          {(Object.keys(BIOMES) as BiomeId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setBiome(id)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                biome === id
                  ? "gradient-cta text-white shadow-[0_0_16px_rgba(129,140,248,0.6)]"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {BIOMES[id].label}
            </button>
          ))}
        </div>
      </div>

      {/* ── ヒーロー：3Dキャンバス背景（進捗イメージに応じてバイオームを切り替え） ── */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative flex h-[100svh] flex-col items-center justify-center px-4 text-center"
      >
        <div className="absolute inset-0 z-0">
          {biome === "vortex" ? <Scene3D /> : <SnowMountainScene />}
        </div>

        <div className="relative z-10">
          <motion.p
            key={biome}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-4 text-xs font-bold uppercase tracking-[0.4em] text-fuchsia-300"
          >
            Design Preview ・ 3D ・ {BIOMES[biome].tagline}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24, letterSpacing: "-0.05em" }}
            animate={{ opacity: 1, y: 0, letterSpacing: "0em" }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="gradient-text font-display text-5xl font-bold leading-[1.05] sm:text-7xl md:text-8xl"
          >
            ETYMON
            <br />
            REIMAGINED
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="mx-auto mt-6 max-w-xl text-balance text-base text-white/60 sm:text-lg"
          >
            「もし UI デザイナーが予算も締切も気にせず、思いつく限りの演出を全部乗せたら」
            という妄想を形にしたデモページです。本番のクイズ画面には一切影響しません。
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1, duration: 0.5, type: "spring" }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.06, boxShadow: "0 0 60px rgba(168,85,247,0.8)" }}
              whileTap={{ scale: 0.96 }}
              className="gradient-cta relative overflow-hidden rounded-full px-8 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-[0_0_40px_rgba(99,102,241,0.6)]"
            >
              Enter the Vortex
            </motion.button>
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-xs uppercase tracking-[0.3em] text-white/40"
            >
              ↓ scroll ↓
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── 3Dチルトカード群 ── */}
      <section className="relative z-10 px-4 py-24 sm:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="font-display mx-auto mb-14 max-w-2xl text-center text-3xl font-bold sm:text-4xl"
        >
          もし全部載せたら、
          <span className="gradient-text">こうなる</span>
        </motion.h2>

        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          <TiltCard
            title="3Dバックグラウンド"
            desc="react-three-fiber + ブルームで、常時ゆらめく発光オブジェクトを表示。"
            accent="#818cf8"
          />
          <TiltCard
            title="マウス追従グロー"
            desc="カーソルの動きに光の玉が追従。カードはマウス位置に応じて3D傾斜。"
            accent="#f472b6"
          />
          <TiltCard
            title="バイオーム切り替え"
            desc="進捗（Tier）に応じて3D背景だけが変わり、手前のパネルUIは今まで通り。"
            accent="#38bdf8"
          />
        </div>
      </section>

      {/* ── グリッチ風ステータス表示 ── */}
      <section className="relative z-10 flex flex-col items-center gap-6 px-4 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="glass-panel-dark neon-glow rounded-3xl border border-white/10 px-10 py-8"
        >
          <div className="font-display gradient-text text-6xl font-bold sm:text-8xl">
            9999+
          </div>
          <div className="mt-2 text-xs uppercase tracking-[0.3em] text-white/50">
            伊達に盛ったエフェクト数
          </div>
        </motion.div>

        <p className="max-w-md text-sm text-white/40">
          ※ここまでやると学習アプリとしては正直使いづらいので、本番には反映していません。
          気に入った演出があれば教えてください。部分的に取り入れます。
        </p>

        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          ← 実際のアプリに戻る
        </Link>
      </section>
    </div>
  );
}
