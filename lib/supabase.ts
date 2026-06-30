import { createClient, SupabaseClient } from "@supabase/supabase-js";

function makeClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase環境変数が設定されていません。.env.localを確認してください。"
    );
  }
  return createClient(url, key);
}

let _client: SupabaseClient | undefined;

// Proxy で遅延初期化 — SSG 時はモジュール評価だけで throw しない
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_client) _client = makeClient();
    return (_client as any)[prop as string];
  },
});
