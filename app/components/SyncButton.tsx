"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  downloadAndMerge,
  getCurrentUser,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  uploadProgress,
  DownloadAndMergeResult,
} from "@/lib/sync";
import { WordStat } from "@/lib/types";

function getErrorMessage(err: unknown): string | undefined {
  if (!(err instanceof Error)) return undefined;
  // ブラウザ由来の "String contains non ISO-8859-1 code point" は
  // ヘッダーに壊れた文字（全角スペースやスマートクォート等）が混入した際の
  // 生の技術メッセージで、そのまま出しても原因が伝わらない。
  if (err.message.includes("non ISO-8859-1")) {
    return "認証情報の送信に失敗しました。ログイン状態が壊れている可能性があります。一度ログアウトしてブラウザのデータを消去してから、再度お試しください。";
  }
  return err.message;
}

interface SyncButtonProps {
  stats: WordStat[];
  unlockedPoolSize: number;
  approvedAnswers: Record<string, string[]>;
  onMerged: (merged: DownloadAndMergeResult) => void;
}

export default function SyncButton({
  stats,
  unlockedPoolSize,
  approvedAnswers,
  onMerged,
}: SyncButtonProps) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const syncProgress = useCallback(async () => {
    setStatus("syncing");
    setMessage("");

    try {
      const merged = await downloadAndMerge({
        stats,
        unlockedPoolSize,
        approvedAnswers,
      });
      await uploadProgress(merged);
      onMerged(merged);
      setStatus("done");
      setMessage("同期しました。");
    } catch (err) {
      console.error("Sync error:", err);
      setStatus("error");
      setMessage(getErrorMessage(err) ?? "同期に失敗しました。");
    } finally {
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, [onMerged, stats, unlockedPoolSize, approvedAnswers]);

  useEffect(() => {
    let disposed = false;

    getCurrentUser()
      .then((currentUser) => {
        if (!disposed) setUser(currentUser);
      })
      .catch((err) => {
        console.error("Auth session error:", err);
        if (!disposed) {
          setStatus("error");
          setMessage("ログイン状態を確認できませんでした。");
        }
      });

    // Supabase未設定（環境変数なし）の環境でも、マウント時の throw で
    // アプリ全体を巻き込んで落とさない。同期ボタンだけエラー表示になる。
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      ({
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null);
        if (event === "SIGNED_IN") {
          window.setTimeout(() => {
            syncProgress();
          }, 0);
        }
        if (event === "SIGNED_OUT") {
          setMessage("ログアウトしました。");
        }
      }));
    } catch (err) {
      console.error("Supabase init error:", err);
      // エフェクト本体で同期的に setState すると余分な再レンダーを招くため、
      // マイクロタスクへずらして React のコミット後に反映させる。
      queueMicrotask(() => {
        setStatus("error");
        setMessage(getErrorMessage(err) ?? "同期機能を初期化できませんでした。");
      });
    }

    return () => {
      disposed = true;
      subscription?.unsubscribe();
    };
  }, [syncProgress]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("syncing");
    setMessage("");
    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password);
        setMessage("登録しました。");
      } else {
        await signInWithEmail(email, password);
      }
      setPassword("");
      setStatus("idle");
    } catch (err) {
      console.error("Email auth error:", err);
      setStatus("error");
      setMessage(
        getErrorMessage(err) ??
          (mode === "signup" ? "登録に失敗しました。" : "ログインに失敗しました。"),
      );
    }
  };

  const handleSignOut = async () => {
    setStatus("syncing");
    setMessage("");
    try {
      await signOut();
      setStatus("done");
    } catch (err) {
      console.error("Sign-out error:", err);
      setStatus("error");
      setMessage(getErrorMessage(err) ?? "ログアウトに失敗しました。");
    } finally {
      setTimeout(() => setStatus("idle"), 3000);
    }
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
          onClick={syncProgress}
          disabled={status === "syncing"}
          className="btn-quiet inline-flex h-12 min-w-32 items-center justify-center rounded-xl px-5 text-sm disabled:opacity-50"
        >
          {label}
        </button>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={status === "syncing"}
          className="btn-quiet inline-flex h-12 min-w-32 items-center justify-center rounded-xl px-5 text-sm text-ink-3 disabled:opacity-50"
        >
          ログアウト
        </button>
      </div>
      <p className="max-w-56 truncate text-xs text-ink-3">
        {user.email ?? "ログイン中"}
      </p>
      {message && (
        <p className={`text-xs ${status === "error" ? "text-negative" : "text-positive"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
