import { createClient } from "@supabase/supabase-js";
import { resolveEntitlement, FEATURE, canUseFeature } from "@/lib/entitlements";

export const runtime = "nodejs";
// 課金状態はユーザーごとに異なるためキャッシュしない。
export const dynamic = "force-dynamic";

// -----------------------------------------------------
// 課金特典の「信頼境界」。
// クライアントは UI 出し分けのために entitlements を参照するが、
// 実際にプレミアム特典を許可してよいかは必ずここ（サーバー）が
// 認証済みユーザーの DB レコードを根拠に判断する。
// クライアントから plan を受け取って信じてはいけない。
// -----------------------------------------------------

function getServerClient(accessToken) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // サービスロールがあれば RLS を跨いで確実に読む（Webhook 等のサーバー専用鍵）。
  // なければユーザーの JWT で RLS 越しに自分の行だけ読む。
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !(serviceKey || anonKey)) {
    return null;
  }

  return createClient(url, serviceKey ?? anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });
}

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const accessToken = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : null;

    if (!accessToken) {
      // 未ログインは常に無料エンタイトルメント。
      return json(buildResponse(null));
    }

    const supabase = getServerClient(accessToken);
    if (!supabase) {
      return Response.json(
        { error: "SUPABASE_NOT_CONFIGURED" },
        { status: 500 },
      );
    }

    // トークンを検証して本人を確定（クライアントの自己申告は信じない）。
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      return json(buildResponse(null));
    }

    const { data: row, error: rowError } = await supabase
      .from("entitlements")
      .select("plan, status, current_period_end")
      .eq("user_id", user.id)
      .maybeSingle();
    if (rowError) throw rowError;

    return json(buildResponse(row ?? null));
  } catch (error) {
    console.error("entitlement lookup failed", error);
    return Response.json({ error: "ENTITLEMENT_LOOKUP_FAILED" }, { status: 500 });
  }
}

function buildResponse(row) {
  const entitlement = resolveEntitlement(row);
  // 機能フラグはサーバーで確定させて返す（クライアントは表示に使うだけ）。
  const features = Object.fromEntries(
    Object.values(FEATURE).map((f) => [f, canUseFeature(entitlement, f)]),
  );
  return {
    plan: entitlement.plan,
    status: entitlement.status,
    isPremium: entitlement.isPremium,
    active: entitlement.active,
    periodEnd: entitlement.periodEnd ? entitlement.periodEnd.toISOString() : null,
    features,
  };
}

function json(body) {
  return Response.json(body, {
    headers: { "Cache-Control": "no-store" },
  });
}
