"use client";

import { RETENTION_LEVELS } from "@/lib/retention";

const RADIUS = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export interface RetentionRingProps {
  /** 出題プールの語を定着レベルごとに数えたもの。添字は level と一致（0=未出題〜5=Lv.5） */
  levelCounts: number[];
  /** 実際に出題対象となっている語数。リングの分母 */
  poolSize: number;
}

/** 隣り合う段の色が近くても境目がわかるよう、区間の前後に空ける隙間の弧長(px) */
const SEGMENT_GAP = 1.4;

/** 円周上の一区間だけを描くための dash 指定。区間の前後に SEGMENT_GAP 分の隙間を空ける */
function arcDash(startRatio: number, lengthRatio: number) {
  const length = Math.max(lengthRatio * CIRCUMFERENCE - SEGMENT_GAP, 0);
  const offset = startRatio * CIRCUMFERENCE + SEGMENT_GAP / 2;
  return {
    strokeDasharray: `${length} ${CIRCUMFERENCE}`,
    strokeDashoffset: -offset,
  };
}

/**
 * 定着レベル（未出題＋Lv.1〜Lv.5の6段階）の内訳ドーナツ。
 *
 * 分母を全3440語ではなく「解放プール」にしているのは、全語数だと
 * 40/3440 = 1% のリングになり、1セット分の変化が目で見えないため。
 *
 * 未出題（一度も出題されていない）からLv.5（誤答から回復済みで定着）まで、
 * 段階が進むほど明るくなる色を積み上げて塗る。隣接する段は輝度差だけでは
 * 境目が見えにくいため、区間の前後に隙間（SEGMENT_GAP）を空けて区切りを作る。
 * 1本のリングの中に「まだ浅い語がどれだけ残っているか」と
 * 「どれだけ育っているか」の両方が出る。実数の内訳はこのすぐ下に文字でも出す
 * （色だけに意味を乗せない）。
 */
export default function RetentionRing({ levelCounts, poolSize }: RetentionRingProps) {
  const safePoolSize = poolSize > 0 ? poolSize : 0;
  const ratios = RETENTION_LEVELS.map((_, i) =>
    safePoolSize > 0 ? (levelCounts[i] ?? 0) / safePoolSize : 0,
  );

  const totalLevel = RETENTION_LEVELS.reduce(
    (sum, { level }, i) => sum + level * (levelCounts[i] ?? 0),
    0,
  );
  const avgLevel = safePoolSize > 0 ? totalLevel / safePoolSize : 0;

  const breakdownLabel = RETENTION_LEVELS.map(
    ({ label }, i) => `${label} ${levelCounts[i] ?? 0}語`,
  ).join("、");

  const arcs = RETENTION_LEVELS.reduce<
    { level: number; color: string; start: number; ratio: number }[]
  >((acc, { level, color }, i) => {
    const ratio = ratios[i];
    const start = acc.length > 0 ? acc[acc.length - 1].start + acc[acc.length - 1].ratio : 0;
    return [...acc, { level, color, start, ratio }];
  }, []);

  return (
    <svg
      viewBox="0 0 44 44"
      className="h-[68px] w-[68px] shrink-0"
      role="img"
      aria-label={`出題プール${poolSize}語の定着レベル内訳。${breakdownLabel}。平均レベル${avgLevel.toFixed(1)}`}
    >
      <g transform="rotate(-90 22 22)" fill="none" strokeWidth={4}>
        <circle cx="22" cy="22" r={RADIUS} style={{ stroke: "var(--line)" }} />
        {arcs.map(
          ({ level, color, start, ratio }) =>
            ratio > 0 && (
              <circle
                key={level}
                cx="22"
                cy="22"
                r={RADIUS}
                style={{ stroke: color, ...arcDash(start, ratio) }}
              />
            ),
        )}
      </g>
      {/* リングが表しているのは内訳なので、中央には要約として平均レベルを置く。
          「Lv」を添えて、これが定着レベルの平均であることを数字だけで
          誤解しないようにする（各レベルの実数はこの要素の aria-label と、
          呼び出し側が表示する内訳リストが持つ）。 */}
      <text x="22" textAnchor="middle" className="tabular-nums" style={{ fill: "var(--ink-1)" }}>
        <tspan x="22" y="19" className="text-[6px]" style={{ fill: "var(--ink-3)" }}>
          平均Lv
        </tspan>
        <tspan x="22" y="29" className="text-[10px]">
          {avgLevel.toFixed(1)}
        </tspan>
      </text>
    </svg>
  );
}
