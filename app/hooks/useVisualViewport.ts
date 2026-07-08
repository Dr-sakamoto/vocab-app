"use client";

import { useEffect } from "react";

/**
 * スマホのソフトウェアキーボード対応。
 *
 * キーボードが出るとブラウザはレイアウトビューポートを変えずに
 * 「視覚ビューポート」だけを縮小・パンするため、100dvh 前提のレイアウトや
 * sticky/fixed 要素が見える範囲の外に出てしまう。
 * visualViewport の高さとオフセットを CSS 変数として :root に反映し、
 * CSS 側（globals.css の .quiz-shell）で画面を視覚ビューポートに
 * ピン留めできるようにする。
 *
 * - --vvh: 視覚ビューポートの高さ（キーボード表示中はその分だけ縮む）
 * - --vvt: レイアウトビューポート上端から視覚ビューポート上端までのオフセット
 */
export function useVisualViewportVars() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return undefined;

    const root = document.documentElement;
    const update = () => {
      root.style.setProperty("--vvh", `${viewport.height}px`);
      root.style.setProperty("--vvt", `${viewport.offsetTop}px`);
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      root.style.removeProperty("--vvh");
      root.style.removeProperty("--vvt");
    };
  }, []);
}
