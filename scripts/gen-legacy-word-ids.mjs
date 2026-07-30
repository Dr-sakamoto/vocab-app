/**
 * lib/vocab/legacyWordIds.ts を生成する。
 *
 * 旧ID `w${i}` → 安定ID の対応表を、その時点の QUESTIONS の並び順から作る。
 * 生成物は「凍結スナップショット」であり、一度コミットしたら原則として
 * 再生成してはいけない（並べ替え後に再生成すると旧IDの解決先が変わり、
 * 既存ユーザーの統計が別の単語へ移ってしまう）。
 *
 * 使い方: npx tsx scripts/gen-legacy-word-ids.mjs
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { QUESTIONS } from "../lib/vocab/index.ts";
import { toWordId } from "../lib/vocab/wordId.ts";

const ids = QUESTIONS.map((q) => toWordId(q.target, q.partOfSpeech));

const header = `// 自動生成: npx tsx scripts/gen-legacy-word-ids.mjs
//
// 旧ID \`w\${i}\` を安定IDへ対応づける凍結スナップショット。
// 添字は「この表を作った時点の QUESTIONS の並び順」を指す。
//
// この表は再生成しないこと。語彙を並べ替えたあとに作り直すと、
// 旧IDの解決先が変わり既存ユーザーの統計が別の単語へ移る。
// 語彙の追加・削除・並べ替えをしても、この表はそのまま残す。

/** 旧ID \`w\${i}\` の i 番目が指していた単語の安定ID */
export const LEGACY_WORD_ID_ORDER: readonly string[] = [
`;

const body = ids.map((id) => `  ${JSON.stringify(id)},`).join("\n");
const out = `${header}${body}\n];\n`;

const here = dirname(fileURLToPath(import.meta.url));
const dest = join(here, "..", "lib", "vocab", "legacyWordIds.ts");
writeFileSync(dest, out);
console.log(`wrote ${dest} (${ids.length} ids)`);
