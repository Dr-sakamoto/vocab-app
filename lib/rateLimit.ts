// =====================================================
// 固定ウィンドウ方式のシンプルなレート制限。
// サーバーレスの1インスタンス内でのみ有効（インスタンス間で
// 状態は共有されない）。Redis等の外部ストアなしで、乱用時の
// API課金の急増を抑える最低限の防御として導入。
// =====================================================

interface Bucket {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
  now: number = Date.now(),
): RateLimitResult {
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

/** テスト・長時間稼働プロセスでのメモリリーク防止用。本番コードからは呼ばない */
export function _resetRateLimitState(): void {
  buckets.clear();
}
