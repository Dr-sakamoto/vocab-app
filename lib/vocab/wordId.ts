/**
 * 単語の安定ID。
 *
 * 旧実装は配列の添字直結（`w${i}`）だったため、語彙データの途中に1語でも
 * 挿入・削除・並べ替えをすると以降の全IDがずれ、既存ユーザーの正誤統計が
 * 別の単語へ付け替わっていた。target と品詞から決まるIDにすることで、
 * 配列順の変更が統計に影響しなくなる。
 *
 * 品詞まで含めるのは、同じ target が品詞違いで複数存在するため
 * （digest / retreat / hug / sneeze の4組）。target だけでは一意にならない。
 */
export function toWordId(target: string, partOfSpeech: string): string {
  return `${slugify(target)}:${slugify(partOfSpeech)}`;
}

/** 英数以外（空白・ハイフン・アポストロフィ・スラッシュ）を `-` に畳む */
function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** 旧ID形式。移行のためだけに参照する */
const LEGACY_WORD_ID = /^w(\d+)$/;

/**
 * 旧ID `w${i}` から添字を取り出す。旧ID形式でなければ null。
 *
 * 添字が指す単語は「凍結スナップショット」（legacyWordIds.ts）で解決すること。
 * 現行の QUESTIONS を引くと、並べ替え後に誤った単語へ結び付いてしまう。
 */
export function parseLegacyWordId(rawId: string): number | null {
  const matched = LEGACY_WORD_ID.exec(rawId);
  if (!matched) return null;
  const index = Number(matched[1]);
  return Number.isSafeInteger(index) && index >= 0 ? index : null;
}
