"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  downloadAndMerge,
  getCurrentUser,
  signInWithGoogle,
  signOut,
  uploadProgress,
  DownloadAndMergeResult,
} from "@/lib/sync";
import { MonsterCollection, WordStat } from "@/lib/types";

function getErrorMessage(err: unknown): string | undefined {
  return err instanceof Error ? err.message : undefined;
}

interface SyncButtonProps {
  stats: WordStat[];
  unlockedPoolSize: number;
  monsterCollection: MonsterCollection;
  approvedAnswers?: Record<string, string[]>;
  onMerged: (merged: DownloadAndMergeResult) => void;
}

export default function SyncButton({
  stats,
  unlockedPoolSize,
  monsterCollection,
  onMerged,
}: SyncButtonProps) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const syncProgress = useCallback(async () => {
    setStatus("syncing");
    setMessage("");

    try {
      const merged = await downloadAndMerge({
        stats,
        unlockedPoolSize,
        monsterCollection,
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
  }, [monsterCollection, onMerged, stats, unlockedPoolSize]);

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

  const handleGoogleSignIn = async () => {
    setStatus("syncing");
    setMessage("");
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Google sign-in error:", err);
      setStatus("error");
      setMessage(getErrorMessage(err) ?? "Googleログインを開始できませんでした。");
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
      <div className="flex flex-col items-start gap-1">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={status === "syncing"}
          className="inline-flex h-12 min-w-32 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
        >
          Googleで同期
        </button>
        {message && (
          <p className={`text-xs ${status === "error" ? "text-rose-600" : "text-zinc-500"}`}>
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1 text-left">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={syncProgress}
          disabled={status === "syncing"}
          className="inline-flex h-12 min-w-32 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
        >
          {label}
        </button>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={status === "syncing"}
          className="inline-flex h-12 min-w-32 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
        >
          ログアウト
        </button>
      </div>
      <p className="max-w-56 truncate text-xs text-zinc-500">
        {user.email ?? "Googleログイン中"}
      </p>
      {message && (
        <p className={`text-xs ${status === "error" ? "text-rose-600" : "text-emerald-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
