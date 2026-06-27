import { supabase } from "./supabase";
import { resolveEntitlement, freeEntitlement } from "./entitlements";

// -----------------------------------------------------
// クライアント側のエンタイトルメント取得ヘルパ。
// サーバー(/api/entitlement)が検証した結果を取りに行く。
// ここで得た値は「UIの出し分け」専用。課金特典の最終許可は
// 常にサーバー側で再検証されることを前提にする。
// -----------------------------------------------------

/**
 * ログイン中ユーザーの検証済みエンタイトルメントを取得する。
 * 未ログイン・エラー時は無料エンタイトルメントにフォールバック。
 * @returns {Promise<ReturnType<typeof resolveEntitlement>>}
 */
export async function fetchEntitlement() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers = { "Content-Type": "application/json" };
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const res = await fetch("/api/entitlement", { headers, cache: "no-store" });
    if (!res.ok) return freeEntitlement();

    const body = await res.json();
    // サーバー応答（plan/status/current_period_end 相当）を
    // 同じ正規化ロジックに通して、クライアントでも一貫した形にする。
    return resolveEntitlement({
      plan: body.plan,
      status: body.status,
      current_period_end: body.periodEnd,
    });
  } catch {
    return freeEntitlement();
  }
}
