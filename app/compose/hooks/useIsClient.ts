"use client";

import { useSyncExternalStore } from "react";

/** 何も購読しない（値が変わるのはハイドレーションの一度だけ） */
const subscribe = () => () => {};

/**
 * ハイドレーションが済んだかを返す。
 *
 * 学習の状態は localStorage にあり、サーバー側では読めない。読める側の
 * 値でいきなり描くとサーバーの出力と食い違ってハイドレーションが壊れるので、
 * 「サーバーと同じ空の状態で1回描き、ハイドレーション後に本物へ差し替える」
 * という2段構えにする。
 *
 * useEffect で setState する書き方でも同じ絵は出せるが、それは
 * 「effect の中で同期的に setState する」ことになり、React の推奨から外れる
 * （lint も止める）。useSyncExternalStore はこの2段構えのために用意された口。
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
