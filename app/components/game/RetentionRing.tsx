"use client";

const RADIUS = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export interface RetentionRingProps {
  /** 解放プールのうち定着済みの語数（このセット終了後の値） */
  retained: number;
  /** 実際に出題対象となっている語数。リングの分母 */
  poolSize: number;
  /** このセットで定着済みが何語増えたか。減った場合は負の数 */
  gain: number;
  /** 現在の到達段階の色。リングの本体はこの色で塗る */
  tierColor: string;
}

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** 円周上の一区間だけを描くための dash 指定 */
function arcDash(startRatio: number, lengthRatio: number) {
  return {
    strokeDasharray: `${lengthRatio * CIRCUMFERENCE} ${CIRCUMFERENCE}`,
    strokeDashoffset: -startRatio * CIRCUMFERENCE,
  };
}

/**
 * 定着率のドーナツ。
 *
 * 分母を全3440語ではなく「解放プール」にしているのは、全語数だと
 * 40/3440 = 1% のリングになり、1セット分の変化が目で見えないため。
 *
 * 増減分（gain）だけは判定色で塗り分けて、そのセットで動いた量を
 * リングの中に残す。プールが解放されると分母が増えて割合は下がりうるので、
 * 割合とは別に「+N語」の実数を必ず併記する側（InlineResult）と対にして使う。
 */
export default function RetentionRing({
  retained,
  poolSize,
  gain,
  tierColor,
}: RetentionRingProps) {
  const nowRatio = poolSize > 0 ? clampRatio(retained / poolSize) : 0;
  const beforeRatio = poolSize > 0 ? clampRatio((retained - gain) / poolSize) : 0;

  // 増えた分は「前回の到達点から先」、減った分は「今の到達点から先」に出る
  const solidRatio = Math.min(nowRatio, beforeRatio);
  const deltaRatio = Math.abs(nowRatio - beforeRatio);
  const deltaColor = gain >= 0 ? "var(--positive)" : "var(--negative)";

  const pct = Math.round(nowRatio * 100);

  const deltaLabel =
    gain > 0 ? `このセットで${gain}語増えた`
    : gain < 0 ? `このセットで${-gain}語減った`
    : "このセットでの増減なし";

  return (
    <svg
      viewBox="0 0 44 44"
      className="h-[68px] w-[68px] shrink-0"
      role="img"
      aria-label={`出題プール${poolSize}語のうち${retained}語が定着、${pct}%。${deltaLabel}`}
    >
      <g transform="rotate(-90 22 22)" fill="none" strokeWidth={4}>
        <circle cx="22" cy="22" r={RADIUS} style={{ stroke: "var(--line)" }} />
        {solidRatio > 0 && (
          <circle
            cx="22"
            cy="22"
            r={RADIUS}
            strokeLinecap="round"
            style={{ stroke: tierColor, ...arcDash(0, solidRatio) }}
          />
        )}
        {deltaRatio > 0 && (
          <circle
            cx="22"
            cy="22"
            r={RADIUS}
            strokeLinecap="round"
            style={{ stroke: deltaColor, ...arcDash(solidRatio, deltaRatio) }}
          />
        )}
      </g>
      {/* リングが表しているのは割合なので、中央も割合にする。
          実数（何語）は隣のテキストが持つ。ここに小さな添え字を足すと
          68px の中で 8px 未満になり読めなくなるため、数字ひとつに絞る。 */}
      <text
        x="22"
        y="22"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-[10px] tabular-nums"
        style={{ fill: "var(--ink-1)" }}
      >
        {pct}%
      </text>
    </svg>
  );
}
