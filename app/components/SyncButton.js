"use client";

import { useState } from "react";
import { uploadProgress, downloadAndMerge } from "@/lib/sync";

/**
 * SyncButton
 *
 * props:
 *   stats, unlockedPoolSize, monsterTotalXP  — 現在のローカル状態
 *   onMerged({ stats, unlockedPoolSize, monsterTotalXP }) — マージ後にpage.jsへ反映
 */
export default function SyncButton({
  stats,
  unlockedPoolSize,
  monsterTotalXP,
  onMerged,
}) {
  const [status, setStatus] = useState("idle"); // idle | syncing | done | error
  const [message, setMessage] = useState("");

  const handleSync = async () => {
    setStatus("syncing");
    setMessage("");
    try {
      // 1. まずリモートと取得・マージ
      const merged = await downloadAndMerge({ stats, unlockedPoolSize, monsterTotalXP });
      // 2. マージ結果をリモートへ書き戻し
      await uploadProgress(merged);
      // 3. ローカルへ反映
      onMerged(merged);
      setStatus("done");
      setMessage("同期完了！");
    } catch (err) {
      console.error("Sync error:", err);
      setStatus("error");
      setMessage("同期に失敗しました。ネットワークを確認してください。");
    } finally {
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const label =
    status === "syncing"
      ? "同期中…"
      : status === "done"
      ? "✓ 完了"
      : status === "error"
      ? "⚠ エラー"
      : "☁ 進捗を同期";

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleSync}
        disabled={status === "syncing"}
        className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
      >
        {label}
      </button>
      {message && (
        <p
          className={`text-xs ${
            status === "error" ? "text-rose-600" : "text-emerald-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
