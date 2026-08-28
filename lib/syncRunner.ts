/**
 * 同期の実行を1本にまとめる小さな調停役。
 *
 * 自動同期は「起動時」「10問セットの区切り」「タブの表示・非表示」など
 * 複数の合図から呼ばれる。そのまま呼ぶと、
 * - ダウンロードとアップロードが交錯して古い値で上書きする
 * - タブを往復するたびに何度も通信する
 * といった事故が起きるため、同時実行の抑止と最小間隔の間引きをここで行う。
 */
export interface SyncRunnerOptions {
  /** 直前の実行からこの時間内の自動同期は間引く（手動同期は force で貫通） */
  minIntervalMs?: number;
  /** テスト用の時刻源 */
  now?: () => number;
}

export interface SyncRunner {
  /**
   * 同期を要求する。実際に新しく走らせたら true。
   * 実行中なら、その完了を待ってから false を返す（二重実行しない）。
   */
  run(options?: { force?: boolean }): Promise<boolean>;
  isRunning(): boolean;
}

export function createSyncRunner(
  sync: () => Promise<void>,
  { minIntervalMs = 0, now = () => Date.now() }: SyncRunnerOptions = {},
): SyncRunner {
  let inFlight: Promise<void> | null = null;
  let lastRunAt = Number.NEGATIVE_INFINITY;

  return {
    run({ force = false } = {}) {
      if (inFlight) return inFlight.then(() => false);
      if (!force && now() - lastRunAt < minIntervalMs) return Promise.resolve(false);

      let settle: () => void = () => {};
      const done = new Promise<void>((resolve) => {
        settle = resolve;
      });
      inFlight = done;

      // sync をマイクロタスクへ逃がしてから走らせる。同期的に throw されても
      // inFlight の後始末が先に走って「実行中のまま固まる」状態を作らない。
      Promise.resolve()
        .then(sync)
        // 失敗の通知は sync 側の責務。ここで握りつぶし、自動同期のたびに
        // unhandled rejection を出さないようにする。
        .catch(() => {})
        .then(() => {
          lastRunAt = now();
          inFlight = null;
          settle();
        });

      return done.then(() => true);
    },
    isRunning: () => inFlight !== null,
  };
}
