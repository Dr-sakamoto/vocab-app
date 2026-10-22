"use client";

import { useState } from "react";
import SyncButton from "./SyncButton";
import { buildReminderIcs, parseReminderTime } from "@/lib/reminderCalendar";
import { SOUND, FLASH } from "@/lib/constants";
import type { CloudSyncController } from "@/app/hooks/useCloudSync";

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundVolume: number;
  onSoundVolumeChange: (value: number) => void;
  pronunciationEnabled: boolean;
  onPronunciationToggle: () => void;
  pronunciationVolume: number;
  onPronunciationVolumeChange: (value: number) => void;
  flashSpeed: number;
  onFlashSpeedChange: (value: number) => void;
  mistakeThreshold: number;
  onMistakeThresholdChange: (value: number) => void;
  cloudSync: CloudSyncController;
}

/** 設定モーダル。`/`・`/result` どちらの画面からも同じ内容で開く */
export default function SettingsModal({
  isOpen,
  onClose,
  soundVolume,
  onSoundVolumeChange,
  pronunciationEnabled,
  onPronunciationToggle,
  pronunciationVolume,
  onPronunciationVolumeChange,
  flashSpeed,
  onFlashSpeedChange,
  mistakeThreshold,
  onMistakeThresholdChange,
  cloudSync,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/60 p-4">
      <div className="my-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-surface-1 p-4 shadow-xl">
        <div className="sticky -top-4 -mt-4 mb-3 flex items-center justify-between bg-surface-1 pt-4">
          <h2 className="text-base text-ink-1">設定</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-lg leading-none text-ink-3 transition hover:bg-surface-2 hover:text-ink-1"
            aria-label="close"
          >
            ×
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-line px-3 py-2.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-ink-1">効果音</span>
            <span className="text-xs tabular-nums text-ink-3">
              {Math.round(soundVolume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={SOUND.MIN_VOLUME}
            max={SOUND.MAX_VOLUME}
            step={0.01}
            value={soundVolume}
            onChange={(e) => onSoundVolumeChange(Number(e.target.value))}
            aria-label="効果音の音量"
            className="w-full accent-[var(--accent)]"
          />
        </div>

        <div className="mb-4 flex items-center justify-between rounded-xl border border-line px-3 py-2.5">
          <span className="text-sm text-ink-1">発音</span>
          <button
            type="button"
            role="switch"
            aria-checked={pronunciationEnabled}
            aria-label="英語の発音読み上げのオン・オフ"
            onClick={onPronunciationToggle}
            className={[
              "relative h-7 w-12 shrink-0 rounded-full transition-colors",
              pronunciationEnabled ? "bg-accent" : "bg-line-strong",
            ].join(" ")}
          >
            <span
              className={[
                "absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
                pronunciationEnabled ? "translate-x-5" : "translate-x-0",
              ].join(" ")}
            />
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-line px-3 py-2.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-ink-1">発音の音量</span>
            <span className="text-xs tabular-nums text-ink-3">
              {Math.round(pronunciationVolume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={SOUND.MIN_VOLUME}
            max={SOUND.MAX_VOLUME}
            step={0.01}
            value={pronunciationVolume}
            disabled={!pronunciationEnabled}
            onChange={(e) => onPronunciationVolumeChange(Number(e.target.value))}
            aria-label="発音読み上げの音量"
            className="w-full accent-[var(--accent)] disabled:opacity-40"
          />
        </div>

        <div className="mb-4 rounded-xl border border-line px-3 py-2.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-ink-1">フラッシュ速度</span>
            <span className="text-xs tabular-nums text-ink-3">
              {flashSpeed.toFixed(1)}秒 / 語
            </span>
          </div>
          <input
            type="range"
            min={FLASH.MIN_SPEED_SEC}
            max={FLASH.MAX_SPEED_SEC}
            step={0.1}
            value={flashSpeed}
            onChange={(e) => onFlashSpeedChange(Number(e.target.value))}
            aria-label="フラッシュ速度（秒/語）"
            className="w-full accent-[var(--accent)]"
          />
        </div>

        <div className="mb-4 rounded-xl border border-line px-3 py-2.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-ink-1">苦手フラッシュの苦手度</span>
            <span className="text-xs tabular-nums text-ink-3">
              {mistakeThreshold}回以上
            </span>
          </div>
          <input
            type="range"
            min={FLASH.MISTAKE_THRESHOLD_MIN}
            max={FLASH.MISTAKE_THRESHOLD_MAX}
            step={1}
            value={mistakeThreshold}
            onChange={(e) => onMistakeThresholdChange(Number(e.target.value))}
            aria-label="苦手フラッシュの苦手度（間違えた回数のしきい値）"
            className="w-full accent-[var(--accent)]"
          />
          <p className="mt-1.5 text-[11px] text-ink-3">
            下げるほど、少し間違えただけの語も苦手フラッシュの対象に入る。
            誤答の2倍以上正解できた語は、回数に関わらず卒業して対象から外れる
          </p>
        </div>

        <ReminderSection />

        <h3 className="mb-2 text-sm text-ink-2">クラウド同期</h3>
        <SyncButton sync={cloudSync} />
      </div>
    </div>
  );
}

/**
 * 毎日のリマインダー。プッシュ通知の代わりに、端末のカレンダーへ毎日の予定
 * （通知つき）として登録してもらう。サーバー不要で、どの端末でも確実に鳴る。
 */
function ReminderSection() {
  const [time, setTime] = useState("20:00");
  const valid = parseReminderTime(time) !== null;

  const download = () => {
    if (!valid) return;
    const ics = buildReminderIcs({ time, url: window.location.origin, now: new Date() });
    const href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const link = document.createElement("a");
    link.href = href;
    link.download = "vocab-reminder.ics";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  };

  return (
    <div className="mb-4 rounded-xl border border-line px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-ink-1">毎日のリマインダー</span>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          aria-label="リマインダーの時刻"
          className="answer-field rounded-md px-2 py-1 text-sm tabular-nums"
        />
      </div>
      <button
        type="button"
        onClick={download}
        disabled={!valid}
        className="btn-quiet mt-2 flex h-10 w-full items-center justify-center rounded-lg text-sm"
      >
        カレンダーに追加
      </button>
      <p className="mt-1.5 text-[11px] text-ink-3">
        端末のカレンダーに、毎日この時刻の予定（通知つき）として登録する。
        やめるときはカレンダーから予定を消す
      </p>
    </div>
  );
}
