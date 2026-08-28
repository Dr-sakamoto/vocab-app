import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

// supabase db push は `<14桁のUTCタイムスタンプ>_<名前>.sql` というファイル名から
// バージョンを読み、その昇順で未適用分を流す。名前が崩れた1本があるだけで
// 適用順が狂ったり適用済み判定を取り違えたりするため、形と並びを見張る。
const MIGRATIONS_DIR = fileURLToPath(new URL("../supabase/migrations/", import.meta.url));
const FILENAME = /^(\d{14})_[a-z0-9]+(?:_[a-z0-9]+)*\.sql$/;

const files = readdirSync(MIGRATIONS_DIR)
  .filter((name) => name.endsWith(".sql"))
  .sort();

function versionOf(name) {
  const matched = name.match(FILENAME);
  assert.ok(matched, `${name} is not a valid migration filename`);
  return matched[1];
}

test("migrations directory is not empty", () => {
  assert.ok(files.length > 0);
});

test("every migration filename is a timestamp plus a snake_case name", () => {
  for (const name of files) {
    assert.match(name, FILENAME);
  }
});

test("filename order is chronological order, with no duplicated version", () => {
  const versions = files.map(versionOf);
  assert.equal(new Set(versions).size, versions.length);
  for (let i = 1; i < versions.length; i += 1) {
    assert.ok(
      Number(versions[i]) > Number(versions[i - 1]),
      `${files[i]} does not come after ${files[i - 1]}`,
    );
  }
});

test("no migration file is empty", () => {
  for (const name of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, name), "utf8").trim();
    assert.ok(sql.length > 0, `${name} is empty`);
  }
});
