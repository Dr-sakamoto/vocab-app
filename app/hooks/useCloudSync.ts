"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  DownloadAndMergeResult,
  downloadAndMerge,
  getCurrentUser,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  uploadProgress,
} from "@/lib/sync";
import { createSyncRunner } from "@/lib/syncRunner";
import { StoredFlashProgress } from "@/lib/flashWeight";
import { readStoredSettings, writeStoredSettings } from "@/lib/settings";
import { StreakState } from "@/lib/streak";
import { STORAGE_KEYS } from "@/lib/constants";
import storage from "@/lib/storage";
import { WordStat } from "@/lib/types";

export type SyncStatus = "idle" | "syncing" | "done" | "error";

/** 直前の同期からこの時間内の自動同期は間引く */
const AUTO_SYNC_MIN_INTERVAL_MS = 5000;
/** 同期の結果表示（同期しました／エラー）を出しておく時間 */
const STATUS_RESET_MS = 3000;

export function getSyncErrorMessage(err: unknown): string | undefined {
  if (!(err instanceof Error)) return undefined;
  // ブラウザ由来の "String contains non ISO-8859-1 code point" は
  // ヘッダーに壊れた文字（全角スペースやスマートクォート等）が混入した際の
  // 生の技術メッセージで、そのまま出しても原因が伝わらない。
  if (err.message.includes("non ISO-8859-1")) {
    return "認証情報の送信に失敗しました。ログイン状態が壊れている可能性があります。一度ログアウトしてブラウザのデータを消去してから、再度お試しください。";
  }
  return err.message;
}

interface UseCloudSyncProps {
  stats: WordStat[];
  unlockedPoolSize: number;
  approvedAnswers: Record<string, string[]>;
  rejectedAnswers: Record<string, string[]>;
  dailyStreak: StreakState;
  /**
   * localStorage の復元が終わったか。復元前に同期すると、空の進捗を
   * クラウドへ書き戻してしまうため、それまで自動同期は始めない。
   */
  isReady: boolean;
  onMerged: (merged: DownloadAndMergeResult) => void;
}

export interface CloudSyncController {
  user: User | null;
  status: SyncStatus;
  message: string;
  /**
   * 起動直後のクラウド同期が決着したか（ログインなしなら即 true、
   * ログインありならダウンロード＋マージが完了して true）。
   * これが立つ前は、この端末の localStorage だけを見た状態でしかない。
   */
  initialSyncDone: boolean;
  /** 手動同期（間引きを貫通する） */
  syncNow: () => void;
  /** 自動同期（実行中・直近実行済みなら黙って見送る） */
  syncAuto: () => void;
  /** 成功したら true（呼び出し側はフォームの後始末に使う） */
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOutUser: () => Promise<boolean>;
}

/**
 * クラウド同期の状態を1か所で持ち、進捗を自動でクラウドと往復させる。
 *
 * 設定モーダルの中だけに同期を置くと、ユーザーが毎回ボタンを押さない限り
 * 端末間で進捗が揃わない。ここでログイン状態をアプリ全体で保持し、
 * 起動時・10問セットの区切り・タブの表示/非表示で裏側から同期する。
 * 同期は「ダウンロードしてマージ → アップロード」の順で必ず走らせるので、
 * 古い端末の値が新しい進捗を巻き戻すことはない。
 */
export function useCloudSync({
  stats,
  unlockedPoolSize,
  approvedAnswers,
  rejectedAnswers,
  dailyStreak,
  isReady,
  onMerged,
}: UseCloudSyncProps): CloudSyncController {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [message, setMessage] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [initialSyncDone, setInitialSyncDone] = useState(false);

  // 同期処理そのものは再生成せず、送る中身だけ ref で最新に保つ。
  // こうしないと1問ごとに認証購読が張り直されてしまう。
  const snapshotRef = useRef({ stats, unlockedPoolSize, approvedAnswers, rejectedAnswers, dailyStreak });
  const onMergedRef = useRef(onMerged);
  const statusTimerRef = useRef<number | null>(null);

  useEffect(() => {
    snapshotRef.current = { stats, unlockedPoolSize, approvedAnswers, rejectedAnswers, dailyStreak };
    onMergedRef.current = onMerged;
  });

  useEffect(() => {
    return () => {
      if (statusTimerRef.current !== null) window.clearTimeout(statusTimerRef.current);
    };
  }, []);

  const scheduleStatusReset = useCallback(() => {
    if (statusTimerRef.current !== null) window.clearTimeout(statusTimerRef.current);
    statusTimerRef.current = window.setTimeout(() => {
      statusTimerRef.current = null;
      setStatus("idle");
    }, STATUS_RESET_MS);
  }, []);

  const runSync = useCallback(async () => {
    setStatus("syncing");
    setMessage("");
    try {
      // フラッシュ進捗だけは React state ではなく localStorage が置き場所
      // （FlashScreen が自前で持つ）。同期の直前に読み、結果は書き戻す。
      // FlashScreen はマウント時にしか読まないので、再生中に書き換えても
      // 表示は飛ばない＝フローを止めない。
      const flashProgress = storage.get<StoredFlashProgress | null>(
        STORAGE_KEYS.FLASH_PROGRESS,
        null,
      );
      // 前回アップロードし終えた回数。ここからの増分だけを足すことで、
      // 2端末で並行して解いたぶんが片方に丸められずに合流する。
      const syncBase = storage.get<unknown>(STORAGE_KEYS.SYNC_BASE, null);
      // 設定もフラッシュ進捗と同じく localStorage が置き場所。同期の直前に
      // 読み、合流結果を書き戻す。
      const settings = readStoredSettings();
      const merged = await downloadAndMerge({
        ...snapshotRef.current,
        flashProgress,
        syncBase,
        settings,
      });
      const uploaded = await uploadProgress(merged);
      // 基準点の更新はアップロードが通ったあと。失敗時に進めてしまうと、
      // リモートが受け取っていない回数を「同期済み」と見なして次回の増分から
      // 取りこぼす。
      storage.set(STORAGE_KEYS.SYNC_BASE, uploaded.syncBase);
      if (merged.flashProgress) {
        storage.set(STORAGE_KEYS.FLASH_PROGRESS, merged.flashProgress);
      }
      if (merged.settings) writeStoredSettings(merged.settings);
      onMergedRef.current(merged);
      setStatus("done");
      // 単語の進捗（word_stats）は通ったが user_meta が通らなかった場合は、
      // 「同期しました」と言い切らずに、何が同期できていないかを見せる。
      const metaError = merged.metaError ?? uploaded.metaError;
      setMessage(
        metaError
          ? "単語の進捗だけ同期しました。（解放プールとAI判定キャッシュは未同期）"
          : "同期しました。",
      );
    } catch (err) {
      console.error("Sync error:", err);
      setStatus("error");
      setMessage(getSyncErrorMessage(err) ?? "同期に失敗しました。");
    } finally {
      scheduleStatusReset();
    }
  }, [scheduleStatusReset]);

  const runner = useMemo(
    () => createSyncRunner(runSync, { minIntervalMs: AUTO_SYNC_MIN_INTERVAL_MS }),
    [runSync],
  );

  const syncNow = useCallback(() => {
    void runner.run({ force: true });
  }, [runner]);

  const syncAuto = useCallback(() => {
    void runner.run();
  }, [runner]);

  // ── ログイン状態 ───────────────────────────────────────────────────────────
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
      })
      .finally(() => {
        if (!disposed) setAuthChecked(true);
      });

    // Supabase未設定（環境変数なし）の環境でも、マウント時の throw で
    // アプリ全体を巻き込んで落とさない。同期まわりだけエラー表示になる。
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      ({
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null);
        if (event === "SIGNED_OUT") setMessage("ログアウトしました。");
      }));
    } catch (err) {
      console.error("Supabase init error:", err);
      // エフェクト本体で同期的に setState すると余分な再レンダーを招くため、
      // マイクロタスクへずらして React のコミット後に反映させる。
      queueMicrotask(() => {
        setStatus("error");
        setMessage(getSyncErrorMessage(err) ?? "同期機能を初期化できませんでした。");
      });
    }

    return () => {
      disposed = true;
      subscription?.unsubscribe();
    };
  }, []);

  // ── 自動同期 ───────────────────────────────────────────────────────────────
  const userId = user?.id ?? null;

  // 起動時とログイン直後に、別端末で進んだ分を取り込む。
  // ログインなしなら（未ログイン端末には取り込む先がないので）即座に、
  // ログインありならダウンロード＋マージが終わってから initialSyncDone を立てる。
  // これが立つ前に出題を選ぶと、この端末の localStorage だけを見た
  // 古い/浅いプールから1問目を選んでしまう。
  useEffect(() => {
    if (!isReady || !authChecked) return;
    if (!userId) {
      setInitialSyncDone(true);
      return;
    }
    let cancelled = false;
    void runner.run().finally(() => {
      if (!cancelled) setInitialSyncDone(true);
    });
    return () => {
      cancelled = true;
    };
  }, [isReady, authChecked, userId, runner]);

  // 別端末へ移る瞬間（タブを隠す・アプリを閉じる）に押し出し、
  // 戻ってきた瞬間（再表示）に取り込む
  useEffect(() => {
    if (!isReady || !userId) return;

    const handleVisibilityChange = () => syncAuto();
    const handlePageHide = () => syncAuto();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [isReady, userId, syncAuto]);

  // ── 認証 ───────────────────────────────────────────────────────────────────
  // ログイン成功後の取り込みは userId の変化を見る自動同期に任せる。
  const authenticate = useCallback(
    async (
      action: () => Promise<void>,
      { successMessage, failureMessage }: { successMessage: string; failureMessage: string },
    ): Promise<boolean> => {
      setStatus("syncing");
      setMessage("");
      try {
        await action();
        setStatus("idle");
        setMessage(successMessage);
        return true;
      } catch (err) {
        console.error("Auth error:", err);
        setStatus("error");
        setMessage(getSyncErrorMessage(err) ?? failureMessage);
        return false;
      }
    },
    [],
  );

  const signIn = useCallback(
    (email: string, password: string) =>
      authenticate(() => signInWithEmail(email, password), {
        successMessage: "",
        failureMessage: "ログインに失敗しました。",
      }),
    [authenticate],
  );

  const signUp = useCallback(
    (email: string, password: string) =>
      authenticate(() => signUpWithEmail(email, password), {
        successMessage: "登録しました。",
        failureMessage: "登録に失敗しました。",
      }),
    [authenticate],
  );

  const signOutUser = useCallback(async (): Promise<boolean> => {
    setStatus("syncing");
    setMessage("");
    try {
      await signOut();
      setStatus("done");
      return true;
    } catch (err) {
      console.error("Sign-out error:", err);
      setStatus("error");
      setMessage(getSyncErrorMessage(err) ?? "ログアウトに失敗しました。");
      return false;
    } finally {
      scheduleStatusReset();
    }
  }, [scheduleStatusReset]);

  return {
    user,
    status,
    message,
    initialSyncDone,
    syncNow,
    syncAuto,
    signIn,
    signUp,
    signOutUser,
  };
}
