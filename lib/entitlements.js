// =====================================================
// エンタイトルメント（無料 / 有料の線引き）一元管理
// -----------------------------------------------------
// クライアントのUI出し分けと、サーバー側の権限検証の
// 「両方」がこの1ファイルを真実の源として参照する。
// 重要: ここで定義した内容はあくまで「仕様」であり、
// 実際の課金特典の付与可否はサーバー（API/Webhook）が
// entitlements テーブルを根拠に最終判断する。
// クライアントの判定は表示の最適化に過ぎず、信頼境界では
// ない（バイパスされても損をしない設計にすること）。
// =====================================================

/** プラン識別子 */
export const PLAN = Object.freeze({
  FREE: "free",
  PREMIUM: "premium",
});

/** 課金状態（プロバイダ非依存の正規化済みステータス） */
export const ENTITLEMENT_STATUS = Object.freeze({
  ACTIVE: "active", // 有効（期間内 / ライフタイム）
  CANCELED: "canceled", // 解約予約済みだが期間内は有効
  EXPIRED: "expired", // 期限切れ
  INACTIVE: "inactive", // 未課金
});

/** 機能フラグの識別子 */
export const FEATURE = Object.freeze({
  CLOUD_SYNC: "cloudSync", // クラウド同期
  AD_FREE: "adFree", // 広告非表示
  UNLIMITED_PLAY: "unlimitedPlay", // 1日のプレイ回数無制限
  FULL_POOL: "fullPool", // 単語プール上限解放
  ALL_CHAPTERS: "allChapters", // ストーリー全章解放
  MASTER_BALL: "masterBall", // マスターボール系の特典
});

// 数値リミットの既定値。プロダクトとして調整可能な「ダイヤル」。
// FREE 側の制約を緩めれば無料体験が手厚くなり、絞れば課金圧が上がる。
const LIMITS = Object.freeze({
  // 無料ユーザーの1日あたりプレイセッション上限（null = 無制限）
  dailySessions: { [PLAN.FREE]: 5, [PLAN.PREMIUM]: null },
  // 無料ユーザーが解放できる単語プールの上限語数（null = 無制限）
  maxPoolSize: { [PLAN.FREE]: 300, [PLAN.PREMIUM]: null },
});

// 各プランが持つ機能フラグ。
const PLAN_FEATURES = Object.freeze({
  [PLAN.FREE]: Object.freeze({
    [FEATURE.CLOUD_SYNC]: false,
    [FEATURE.AD_FREE]: false,
    [FEATURE.UNLIMITED_PLAY]: false,
    [FEATURE.FULL_POOL]: false,
    [FEATURE.ALL_CHAPTERS]: false,
    [FEATURE.MASTER_BALL]: false,
  }),
  [PLAN.PREMIUM]: Object.freeze({
    [FEATURE.CLOUD_SYNC]: true,
    [FEATURE.AD_FREE]: true,
    [FEATURE.UNLIMITED_PLAY]: true,
    [FEATURE.FULL_POOL]: true,
    [FEATURE.ALL_CHAPTERS]: true,
    [FEATURE.MASTER_BALL]: true,
  }),
});

/** 課金状態が「特典を受けられる」状態か */
export function isEntitlementActive(status) {
  return (
    status === ENTITLEMENT_STATUS.ACTIVE ||
    status === ENTITLEMENT_STATUS.CANCELED // 解約予約でも期間内は有効
  );
}

/**
 * 生のレコード（DB行 / API応答）を正規化したエンタイトルメントに変換する。
 * 期限切れの判定もここで吸収し、呼び出し側は plan を信頼できる。
 * @param {object|null} record - { plan, status, current_period_end } 等
 * @param {Date} [now]
 */
export function resolveEntitlement(record, now = new Date()) {
  const rawPlan = record?.plan ?? PLAN.FREE;
  let status = record?.status ?? ENTITLEMENT_STATUS.INACTIVE;

  const periodEnd = record?.current_period_end
    ? new Date(record.current_period_end)
    : null;
  // 期間終了を過ぎていれば、状態に関わらず期限切れ扱いに落とす。
  if (periodEnd && Number.isFinite(periodEnd.getTime()) && periodEnd < now) {
    status = ENTITLEMENT_STATUS.EXPIRED;
  }

  const active = isEntitlementActive(status);
  const plan = active && rawPlan === PLAN.PREMIUM ? PLAN.PREMIUM : PLAN.FREE;

  return Object.freeze({
    plan,
    status,
    active,
    periodEnd,
    isPremium: plan === PLAN.PREMIUM,
  });
}

/** 未課金（ゲスト含む）の既定エンタイトルメント */
export function freeEntitlement() {
  return resolveEntitlement(null);
}

/** プランから機能の有効/無効を引く。entitlement か plan 文字列のどちらでも可 */
export function canUseFeature(planOrEntitlement, feature) {
  const plan = normalizePlan(planOrEntitlement);
  return Boolean(PLAN_FEATURES[plan]?.[feature]);
}

/**
 * 数値リミットを引く。null は「無制限」を意味する。
 * @returns {number|null}
 */
export function getLimit(planOrEntitlement, limitKey) {
  const plan = normalizePlan(planOrEntitlement);
  const table = LIMITS[limitKey];
  if (!table) return null;
  // null は「無制限」という有効な値。?? でフォールバックさせず、
  // キーの有無で分岐する。
  if (plan in table) return table[plan];
  return PLAN.FREE in table ? table[PLAN.FREE] : null;
}

/**
 * 単語プールの解放希望サイズを、プランの上限でクランプする。
 * サーバー・クライアント双方がこの関数で同じ値を出すこと。
 */
export function clampPoolSizeToPlan(planOrEntitlement, requestedSize) {
  const max = getLimit(planOrEntitlement, "maxPoolSize");
  if (max == null) return requestedSize;
  return Math.min(requestedSize, max);
}

/**
 * 当日これ以上プレイできるか（無料のセッション上限判定）。
 * @param {string|object} planOrEntitlement
 * @param {number} sessionsToday - 当日すでに開始したセッション数
 */
export function canStartSession(planOrEntitlement, sessionsToday) {
  const limit = getLimit(planOrEntitlement, "dailySessions");
  if (limit == null) return true;
  return sessionsToday < limit;
}

function normalizePlan(planOrEntitlement) {
  if (typeof planOrEntitlement === "string") {
    return planOrEntitlement === PLAN.PREMIUM ? PLAN.PREMIUM : PLAN.FREE;
  }
  return planOrEntitlement?.isPremium ? PLAN.PREMIUM : PLAN.FREE;
}
