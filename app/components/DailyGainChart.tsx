"use client";

import { DailyGainPoint } from "@/lib/dailyProgress";

export interface DailyGainChartProps {
  /** 古い日付が先頭。lib/dailyProgress.getDailyGains の戻り値をそのまま渡す */
  points: DailyGainPoint[];
}

const CHART_HEIGHT = 64;
const BAR_GAP = 3;

/**
 * 「毎日の伸び率」棒グラフ。
 *
 * 見せるのは1日ごとの増減（gain）で、伸びた日は緑、減った日（誤答で
 * 定着から外れた語が上回った日）は赤、変化なしの日は目立たない灰の薄い棒に
 * する。RetentionRing 同様チャートライブラリは使わず、既存のSVG手描きの
 * 流儀に合わせている。
 */
export default function DailyGainChart({ points }: DailyGainChartProps) {
  if (points.length === 0) return null;

  const maxAbsGain = Math.max(1, ...points.map((p) => Math.abs(p.gain)));
  const barWidth = 100 / points.length - BAR_GAP;

  return (
    <div>
      <svg
        viewBox={`0 0 100 ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        className="h-16 w-full"
        role="img"
        aria-label={`直近${points.length}日の定着語数の伸び。${points
          .map((p) => `${p.date}は${p.gain > 0 ? "+" : ""}${p.gain}語`)
          .join("、")}`}
      >
        {/* ゼロライン。増減の基準がどこかを常に見せる */}
        <line
          x1={0}
          x2={100}
          y1={CHART_HEIGHT / 2}
          y2={CHART_HEIGHT / 2}
          stroke="var(--line)"
          strokeWidth={1}
        />
        {points.map((p, i) => {
          const barHeight = (Math.abs(p.gain) / maxAbsGain) * (CHART_HEIGHT / 2 - 4);
          const x = i * (barWidth + BAR_GAP);
          const y = p.gain >= 0 ? CHART_HEIGHT / 2 - barHeight : CHART_HEIGHT / 2;
          const color =
            p.gain > 0 ? "var(--positive)" : p.gain < 0 ? "var(--negative)" : "var(--line-strong)";
          return (
            <rect
              key={p.date}
              x={x}
              y={y}
              width={Math.max(barWidth, 1)}
              height={Math.max(barHeight, 1)}
              rx={0.6}
              fill={color}
            />
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-ink-3">
        <span>{points[0].date.slice(5)}</span>
        <span>{points[points.length - 1].date.slice(5)}</span>
      </div>
    </div>
  );
}
