import { test } from "node:test";
import assert from "node:assert/strict";

import {
  PLAN,
  ENTITLEMENT_STATUS,
  FEATURE,
  resolveEntitlement,
  freeEntitlement,
  canUseFeature,
  getLimit,
  clampPoolSizeToPlan,
  canStartSession,
  isEntitlementActive,
} from "../lib/entitlements.js";

test("freeEntitlement は無料・非プレミアム", () => {
  const e = freeEntitlement();
  assert.equal(e.plan, PLAN.FREE);
  assert.equal(e.isPremium, false);
  assert.equal(e.active, false);
});

test("active な premium レコードはプレミアムに解決される", () => {
  const e = resolveEntitlement({
    plan: PLAN.PREMIUM,
    status: ENTITLEMENT_STATUS.ACTIVE,
  });
  assert.equal(e.isPremium, true);
  assert.equal(e.active, true);
});

test("解約予約(canceled)でも期間内なら有効", () => {
  const future = new Date(Date.now() + 86400000).toISOString();
  const e = resolveEntitlement({
    plan: PLAN.PREMIUM,
    status: ENTITLEMENT_STATUS.CANCELED,
    current_period_end: future,
  });
  assert.equal(e.isPremium, true);
  assert.equal(e.active, true);
});

test("期限切れの premium は free に落ちる", () => {
  const past = new Date(Date.now() - 86400000).toISOString();
  const e = resolveEntitlement({
    plan: PLAN.PREMIUM,
    status: ENTITLEMENT_STATUS.ACTIVE,
    current_period_end: past,
  });
  assert.equal(e.isPremium, false);
  assert.equal(e.status, ENTITLEMENT_STATUS.EXPIRED);
});

test("ライフタイム(current_period_end なし)の active は有効のまま", () => {
  const e = resolveEntitlement({
    plan: PLAN.PREMIUM,
    status: ENTITLEMENT_STATUS.ACTIVE,
    current_period_end: null,
  });
  assert.equal(e.isPremium, true);
});

test("機能フラグ: free は広告非表示/同期を持たない、premium は持つ", () => {
  assert.equal(canUseFeature(PLAN.FREE, FEATURE.AD_FREE), false);
  assert.equal(canUseFeature(PLAN.FREE, FEATURE.CLOUD_SYNC), false);
  assert.equal(canUseFeature(PLAN.PREMIUM, FEATURE.AD_FREE), true);
  assert.equal(canUseFeature(PLAN.PREMIUM, FEATURE.CLOUD_SYNC), true);
});

test("canUseFeature は entitlement オブジェクトでも判定できる", () => {
  const premium = resolveEntitlement({
    plan: PLAN.PREMIUM,
    status: ENTITLEMENT_STATUS.ACTIVE,
  });
  assert.equal(canUseFeature(premium, FEATURE.FULL_POOL), true);
});

test("プール上限: free は上限でクランプ、premium は無制限", () => {
  assert.equal(getLimit(PLAN.PREMIUM, "maxPoolSize"), null);
  assert.equal(clampPoolSizeToPlan(PLAN.FREE, 9999), 300);
  assert.equal(clampPoolSizeToPlan(PLAN.FREE, 120), 120);
  assert.equal(clampPoolSizeToPlan(PLAN.PREMIUM, 9999), 9999);
});

test("セッション上限: free は上限到達で開始不可、premium は常に可", () => {
  assert.equal(canStartSession(PLAN.FREE, 4), true);
  assert.equal(canStartSession(PLAN.FREE, 5), false);
  assert.equal(canStartSession(PLAN.PREMIUM, 9999), true);
});

test("isEntitlementActive の真偽", () => {
  assert.equal(isEntitlementActive(ENTITLEMENT_STATUS.ACTIVE), true);
  assert.equal(isEntitlementActive(ENTITLEMENT_STATUS.CANCELED), true);
  assert.equal(isEntitlementActive(ENTITLEMENT_STATUS.EXPIRED), false);
  assert.equal(isEntitlementActive(ENTITLEMENT_STATUS.INACTIVE), false);
});
