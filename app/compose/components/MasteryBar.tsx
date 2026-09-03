import { getMasteryColor } from "@/lib/compose/mastery";

interface MasteryBarProps {
  label: string;
  mastery: number;
  /** 一度も答えていないタグ。値は推定でしかないことを見た目で示す */
  untouched?: boolean;
  /** 答案数。信頼できる数字かどうかの判断材料になるので必ず出す */
  attempts?: number;
  /** セッション前後の差。0 のときは出さない */
  delta?: number;
}

/**
 * 文法タグ1つぶんの習熟度バー。
 *
 * 数字（0〜100）とバーを併記する。バーだけだと「あと何をすれば上がるのか」
 * の手がかりが無く、数字だけだと弱い順の見通しが立たない。
 * 未挑戦は色を持たせず、実測で弱いタグと見た目で区別する。
 */
export default function MasteryBar({
  label,
  mastery,
  untouched = false,
  attempts,
  delta = 0,
}: MasteryBarProps) {
  const color = getMasteryColor(mastery, untouched);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-ink-2">{label}</span>
        <span className="tabular-nums text-ink-3">
          {untouched ? (
            "未挑戦"
          ) : (
            <>
              <span style={{ color }}>{mastery}</span>
              {/* 数字が続けて並ぶと「29 2問」がひとつの数に見える。
                  区切りの字を挟んで、どこまでが習熟度かを示す。 */}
              {attempts !== undefined && <span className="ml-1.5">・{attempts}問</span>}
              {delta !== 0 && (
                <span
                  className="ml-1.5"
                  style={{ color: delta > 0 ? "var(--positive)" : "var(--negative)" }}
                >
                  （{delta > 0 ? `+${delta}` : delta}）
                </span>
              )}
            </>
          )}
        </span>
      </div>
      <div className="gauge-track mt-1 h-1 w-full overflow-hidden rounded-full">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${untouched ? 0 : Math.max(2, mastery)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
