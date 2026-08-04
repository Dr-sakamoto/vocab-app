import { createClient, SupabaseClient } from "@supabase/supabase-js";

const NON_HEADER_SAFE = /[^\x00-\xFF]/;

function makeClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Supabase環境変数が設定されていません。.env.localを確認してください。"
    );
  }
  // URL/anonキーはHTTPヘッダーの値としてそのまま送られるため、コピペ時に
  // 全角スペースやスマートクォートなどが紛れ込むと「headers property from
  // 'RequestInit': String contains non ISO-8859-1 code point」という
  // わかりにくいエラーになる。ここで早期に検知して原因を特定しやすくする。
  if (NON_HEADER_SAFE.test(url) || NON_HEADER_SAFE.test(key)) {
    throw new Error(
      "Supabase環境変数に全角文字やコピペ由来の不正な文字が含まれています。.env.local（またはVercelの環境変数）のNEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEYを確認してください。"
    );
  }
  return createClient(url, key);
}

let _client: SupabaseClient | undefined;

// Proxy で遅延初期化 — SSG 時はモジュール評価だけで throw しない
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_client) _client = makeClient();
    return _client[prop as keyof SupabaseClient];
  },
});
