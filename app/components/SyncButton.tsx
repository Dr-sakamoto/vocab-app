"use client";

import { useState } from "react";
import type { CloudSyncController } from "@/app/hooks/useCloudSync";

interface SyncButtonProps {
  /** 同期の状態はアプリ全体で1つ（useCloudSync）。ここは表示と操作だけ持つ */
  sync: CloudSyncController;
}

export default function SyncButton({ sync }: SyncButtonProps) {
  const { user, status, message } = sync;
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok =
      mode === "signup"
        ? await sync.signUp(email, password)
        : await sync.signIn(email, password);
    if (ok) setPassword("");
  };

  const label =
    status === "syncing"
      ? "処理中..."
      : status === "done"
        ? "同期済み"
        : status === "error"
          ? "エラー"
          : "進捗を同期";

  if (!user) {
    return (
      <form onSubmit={handleEmailAuth} className="flex flex-col items-start gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="メールアドレス"
          autoComplete="email"
          required
          className="h-11 w-56 rounded-lg border border-line-strong bg-surface-2 px-3 text-sm text-ink-1 outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          minLength={6}
          required
          className="h-11 w-56 rounded-lg border border-line-strong bg-surface-2 px-3 text-sm text-ink-1 outline-none"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={status === "syncing"}
            className="btn-quiet inline-flex h-11 min-w-28 items-center justify-center rounded-xl px-5 text-sm disabled:opacity-50"
          >
            {mode === "signup" ? "登録して同期" : "ログインして同期"}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="text-xs text-ink-3 underline"
          >
            {mode === "signup" ? "ログインはこちら" : "はじめての方はこちら"}
          </button>
        </div>
        {message && (
          <p className={`text-xs ${status === "error" ? "text-negative" : "text-ink-3"}`}>
            {message}
          </p>
        )}
      </form>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1 text-left">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={sync.syncNow}
          disabled={status === "syncing"}
          className="btn-quiet inline-flex h-12 min-w-32 items-center justify-center rounded-xl px-5 text-sm disabled:opacity-50"
        >
          {label}
        </button>
        <button
          type="button"
          onClick={() => void sync.signOutUser()}
          disabled={status === "syncing"}
          className="btn-quiet inline-flex h-12 min-w-32 items-center justify-center rounded-xl px-5 text-sm text-ink-3 disabled:opacity-50"
        >
          ログアウト
        </button>
      </div>
      <p className="max-w-56 truncate text-xs text-ink-3">
        {user.email ?? "ログイン中"}
      </p>
      <p className="text-[11px] text-ink-3">
        ログイン中は起動時と10問ごとに自動で同期される
      </p>
      {message && (
        <p className={`text-xs ${status === "error" ? "text-negative" : "text-positive"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
