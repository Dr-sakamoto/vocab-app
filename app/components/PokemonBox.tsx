"use client";

import { useState } from "react";
import { MonsterCollection, MonsterInstance } from "@/lib/types";
import {
  getBoxMonsters,
  getMonsterDisplayState,
  getMonsterLine,
  getPartyCount,
  getPartySlots,
  normalizeMonsterCollection,
} from "@/lib/monster";

type SortMode = "dex" | "level";

interface TileLocation {
  area: "party" | "box" | "remove";
  index: number;
  id: string | null;
}

interface MonsterTileProps {
  monster: MonsterInstance | null;
  location: TileLocation;
  selected: TileLocation | null;
  active?: boolean;
  buddySlot?: boolean;
  boxTile?: boolean;
  transferMode?: boolean;
  selectedForTransfer?: boolean;
  onPick: (location: TileLocation) => void;
  onToggleTransfer?: (id: string) => void;
}

function MonsterTile({
  monster,
  location,
  selected,
  active,
  buddySlot,
  boxTile,
  transferMode,
  selectedForTransfer,
  onPick,
  onToggleTransfer,
}: MonsterTileProps) {
  const current = monster ? getMonsterDisplayState(monster) : null;
  const isHoldingItem = monster?.heldItemType;
  const isSelected =
    selected &&
    selected.area === location.area &&
    selected.index === location.index &&
    selected.id === location.id;

  if (!monster) {
    const canReceive = selected && selected.area !== "party";
    return (
      <button
        type="button"
        onClick={() => canReceive && onPick(location)}
        disabled={!canReceive}
        className={[
          "flex aspect-square items-center justify-center rounded-md border border-dashed text-2xl font-light transition",
          canReceive
            ? "border-[#58d0ff] bg-[#58d0ff]/10 text-[#58d0ff] ring-2 ring-[#58d0ff]/40"
            : "border-[#9a9a9a]/40 bg-black/30 text-[#9a9a9a]/50",
        ].join(" ")}
        aria-label="empty"
      >
        +
      </button>
    );
  }

  const handleClick = () => {
    if (transferMode && boxTile) onToggleTransfer?.(monster.id);
    else onPick(location);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={!!isSelected || !!selectedForTransfer}
      aria-label={`${current!.species.name} Lv. ${current!.level}`}
      className={[
        "relative flex aspect-square flex-col items-center justify-center rounded-md border p-2 transition",
        boxTile ? "bg-black/30 hover:bg-black/15" : "bg-black/30 hover:bg-black/15",
        buddySlot
          ? "parchment shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          : active
          ? "border-[#f5f5f5]"
          : "border-[#9a9a9a]/25 hover:border-[#f5f5f5]/60",
        isSelected ? "ring-2 ring-[#58d0ff] ring-offset-2 ring-offset-black" : "",
        selectedForTransfer ? "border-[#ff5a5a] ring-2 ring-[#ff5a5a]/60 ring-offset-2 ring-offset-black" : "",
      ].join(" ")}
    >
      {buddySlot && (
        <span
          className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-[#9a9a9a] bg-black text-[11px] font-black text-[#ffcf4a]"
          aria-hidden="true"
        >
          ★
        </span>
      )}
      {selectedForTransfer && (
        <span
          className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff5a5a] text-[11px] font-black text-black"
          aria-hidden="true"
        >
          ✓
        </span>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current!.species.sprite}
        alt=""
        aria-hidden="true"
        onError={(e) => {
          if (e.currentTarget.src !== current!.species.fallbackSprite) {
            e.currentTarget.src = current!.species.fallbackSprite;
          }
        }}
        className="h-14 w-14 object-contain sm:h-16 sm:w-16"
        style={{ imageRendering: "pixelated" }}
      />
      <span className={["mt-1 max-w-full truncate text-[11px] font-medium", isHoldingItem ? "text-[#58d0ff]" : "text-[#e6e6e6]"].join(" ")}>
        {current!.species.name}
      </span>
      <span className="font-fantasy text-[10px] tabular-nums text-[#7d7d7d]">Lv. {current!.level}</span>
    </button>
  );
}

interface BoxDropTargetProps {
  selected: TileLocation | null;
  disabled: boolean;
  onPick: (location: TileLocation) => void;
}

function BoxDropTarget({ selected, disabled, onPick }: BoxDropTargetProps) {
  const active = selected?.area === "party" && !disabled;
  return (
    <button
      type="button"
      onClick={() => active && onPick({ area: "remove", index: -1, id: null })}
      disabled={!active}
      aria-label="send to box"
      className={[
        "mt-3 flex h-14 w-full items-center justify-center rounded-md border-2 border-dashed transition",
        active
          ? "border-[#58d0ff] bg-[#58d0ff]/10 text-[#58d0ff] ring-2 ring-[#58d0ff]/40"
          : "border-[#9a9a9a]/30 bg-black/30 text-[#9a9a9a]/40",
      ].join(" ")}
    >
      <span className="text-2xl leading-none">↓▭</span>
    </button>
  );
}

interface PieMenuProps {
  open: boolean;
  transferMode: boolean;
  onToggle: () => void;
  onDexSort: () => void;
  onLevelSort: () => void;
  onTransferMode: () => void;
}

function PieMenu({ open, transferMode, onToggle, onDexSort, onLevelSort, onTransferMode }: PieMenuProps) {
  const items = [
    { label: "DECK No順整列", icon: "No", className: "-left-16 top-0", onClick: onDexSort },
    { label: "レベル順整列", icon: "Lv", className: "top-16 left-0", onClick: onLevelSort },
    { label: "ナビに送る", icon: "🧪", className: "-left-16 -top-16", onClick: onTransferMode },
  ];

  return (
    <div className="relative h-20 w-20 shrink-0">
      {open && items.map((item) => (
        <button
          key={item.label}
          type="button"
          title={item.label}
          aria-label={item.label}
          onClick={item.onClick}
          className={[
            "absolute flex h-10 w-10 items-center justify-center rounded-full border text-xs font-bold shadow-sm transition",
            item.className,
            transferMode && item.label === "ナビに送る"
              ? "border-[#ff5a5a] bg-[#1f0a0a] text-[#ff5a5a]"
              : "border-[#9a9a9a] bg-black text-[#e6e6e6] hover:bg-[#1e1e1e]",
          ].join(" ")}
        >
          {item.icon}
        </button>
      ))}
      <button
        type="button"
        title="ボックスメニュー"
        aria-label="ボックスメニュー"
        aria-expanded={open}
        onClick={onToggle}
        className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#9a9a9a] bg-black text-lg font-black text-[#ffcf4a] shadow-sm hover:bg-[#1e1e1e]"
      >
        ◌
      </button>
    </div>
  );
}

function summarizeTransfers(monsters: MonsterInstance[]): { name: string; count: number }[] {
  const summary = new Map<string, { name: string; count: number }>();
  for (const monster of monsters) {
    const line = getMonsterLine(monster.lineId);
    if (!line) continue;
    summary.set(line.id, {
      name: line.name,
      count: (summary.get(line.id)?.count ?? 0) + 1,
    });
  }
  return [...summary.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ja"));
}

interface PokemonBoxProps {
  collection: MonsterCollection;
  limit?: number;
  forceManage?: boolean;
  onClose?: () => void;
  onSwap?: (first: TileLocation, second: TileLocation) => void;
  onRemove?: (partyIndex: number) => void;
  onSendToProfessor?: (ids: string[]) => void;
  onSortBox?: (mode: SortMode) => void;
  onOpenSync?: () => void;
}

export default function PokemonBox({
  collection,
  limit = 500,
  forceManage = false,
  onClose,
  onSwap,
  onRemove,
  onSendToProfessor,
  onSortBox,
  onOpenSync,
}: PokemonBoxProps) {
  const normalized = normalizeMonsterCollection(collection);
  const partySlots = getPartySlots(normalized);
  const boxMonsters = getBoxMonsters(normalized);
  const partyCount = getPartyCount(normalized);
  const [selected, setSelected] = useState<TileLocation | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [requestedTransferMode, setRequestedTransferMode] = useState(false);
  const [transferIds, setTransferIds] = useState<Set<string>>(() => new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const overLimit = boxMonsters.length > limit;
  const transferMode = requestedTransferMode || forceManage || overLimit;

  const getVisibleBoxMonsters = (): MonsterInstance[] => {
    const query = searchText.trim().toLocaleLowerCase("ja");
    if (!query) return boxMonsters;
    return boxMonsters.filter((monster) => {
      const state = getMonsterDisplayState(monster);
      const line = getMonsterLine(monster.lineId);
      return [
        state.species.name,
        state.species.nameEn,
        String(state.species.id),
        line?.name ?? "",
        line?.id ?? "",
      ].some((value) => String(value ?? "").toLocaleLowerCase("ja").includes(query));
    });
  };
  const visibleBoxMonsters = getVisibleBoxMonsters();

  const selectedTransferMonsters = boxMonsters.filter((monster) => transferIds.has(monster.id));
  const transferSummary = summarizeTransfers(selectedTransferMonsters);
  const totalTransferred = Object.values(normalized.professorTransfers ?? {}).reduce(
    (sum, count) => sum + (Number(count) || 0),
    0,
  );

  const pick = (location: TileLocation) => {
    if (transferMode) return;
    if (location.area === "remove") {
      if (selected?.area === "party") onRemove?.(selected.index);
      setSelected(null);
      return;
    }

    if (location.area === "party" && location.id === null && !selected) return;

    if (!selected) {
      setSelected(location);
      return;
    }

    const same =
      selected.area === location.area &&
      selected.index === location.index &&
      selected.id === location.id;
    if (!same) onSwap?.(selected, location);
    setSelected(null);
  };

  const toggleTransfer = (monsterId: string) => {
    setTransferIds((prev) => {
      const next = new Set(prev);
      if (next.has(monsterId)) next.delete(monsterId);
      else next.add(monsterId);
      return next;
    });
  };

  const confirmTransfer = () => {
    const ids = [...transferIds];
    if (ids.length === 0) return;
    onSendToProfessor?.(ids);
    setTransferIds(new Set());
    setConfirmOpen(false);
    setRequestedTransferMode(false);
  };

  const requestClose = () => {
    if (forceManage || overLimit) return;
    onClose?.();
  };

  return (
    <div className="font-dot fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="parchment max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-lg p-4 shadow-xl sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-[#9a9a9a] bg-black text-sm font-black text-[#ffcf4a]">
              ★
            </div>
            <div>
              <h2 className="fantasy-title text-lg font-semibold text-[#ffcf4a]">エティモン管理</h2>
              <p className={overLimit ? "text-sm font-semibold text-[#ff5a5a]" : "text-xs text-[#7d7d7d]"}>
                ボックス {boxMonsters.length} / {limit}
                {totalTransferred > 0 && ` ・ナビに送った数 ${totalTransferred}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenSync && (
              <button
                type="button"
                onClick={onOpenSync}
                className="brass-btn flex h-10 w-10 items-center justify-center rounded-md text-lg leading-none"
                aria-label="設定"
                title="設定"
              >
                ⚙️
              </button>
            )}
            <button
              type="button"
              onClick={requestClose}
              disabled={forceManage || overLimit}
              className="brass-btn flex h-10 w-10 items-center justify-center rounded-md text-xl leading-none disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="close"
            >
              ×
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="名前・DECK Noで検索"
              className="slot-box h-10 min-w-[200px] rounded-md px-3 text-sm outline-none placeholder:text-[#7d7d7d] focus:ring-2 focus:ring-[#58d0ff]/50"
            />
          </div>
        </div>

        {overLimit && (
          <div className="mb-4 rounded-lg border-2 border-[#ff5a5a] bg-[#1f0a0a] px-4 py-3 text-sm font-medium text-[#ff8a8a]">
            ボックスが上限を超えています。{boxMonsters.length - limit}匹以上をナビに送ってください。
          </div>
        )}

        <section className="wood-panel rounded-lg p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#9a9a9a] bg-black text-[11px] font-black text-[#ffcf4a]">
              ★
            </span>
            <span className="text-sm font-semibold text-[#f5f5f5]">手持ち</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {partySlots.map((monster, index) => (
              <MonsterTile
                key={monster?.id ?? `party-empty-${index}`}
                monster={monster}
                location={{ area: "party", index, id: monster?.id ?? null }}
                selected={selected}
                active={monster?.id === normalized.activeId}
                buddySlot={index === 0}
                transferMode={false}
                onPick={pick}
              />
            ))}
          </div>
          <BoxDropTarget
            selected={selected}
            disabled={partyCount <= 1 || transferMode}
            onPick={pick}
          />
        </section>

        <section className="parchment mt-4 rounded-lg p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[#e6e6e6]">ボックス</div>
              <div className="text-xs text-[#7d7d7d]">
                通常表示
                {transferMode && ` ・ナビに送る ${transferIds.size}匹選択中`}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {transferMode && (
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  disabled={transferIds.size === 0}
                  className="inline-flex h-10 items-center justify-center rounded-md border-2 border-[#ff5a5a] bg-[#ff5a5a] px-4 text-sm font-bold text-black transition hover:brightness-110 disabled:border-[#ff5a5a]/40 disabled:bg-transparent disabled:text-[#ff5a5a]/40"
                >
                  ナビに送る
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {visibleBoxMonsters.map((monster, index) => (
              <MonsterTile
                key={monster.id}
                monster={monster}
                location={{ area: "box", index, id: monster.id }}
                selected={selected}
                selectedForTransfer={transferIds.has(monster.id)}
                transferMode={transferMode}
                boxTile
                onPick={pick}
                onToggleTransfer={toggleTransfer}
              />
            ))}
            {visibleBoxMonsters.length === 0 && (
              <div className="col-span-3 rounded-md border border-dashed border-[#9a9a9a]/30 bg-black/30 px-4 py-8 text-center text-sm text-[#7d7d7d] sm:col-span-6">
                Empty
              </div>
            )}
          </div>
        </section>
      </div>
      <div className="fixed bottom-6 right-6 z-50">
        <PieMenu
          open={menuOpen}
          transferMode={transferMode}
          onToggle={() => setMenuOpen((open) => !open)}
          onDexSort={() => {
            onSortBox?.("dex");
            setMenuOpen(false);
          }}
          onLevelSort={() => {
            onSortBox?.("level");
            setMenuOpen(false);
          }}
          onTransferMode={() => {
            if (forceManage || overLimit) return;
            setRequestedTransferMode((mode) => !mode);
            setSelected(null);
            setMenuOpen(false);
          }}
        />
      </div>

      {confirmOpen && (
        <div className="font-dot fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="parchment w-full max-w-md rounded-lg p-5 shadow-xl">
            <h3 className="fantasy-title text-lg font-semibold text-[#ffcf4a]">ナビに送りますか？</h3>
            <p className="mt-2 text-sm text-[#e6e6e6]">
              選択した{selectedTransferMonsters.length}匹はボックスからいなくなります。
            </p>
            <div className="mt-4 rounded-md border border-[#9a9a9a]/20 bg-black/40 p-3 text-sm text-[#e6e6e6]">
              {transferSummary.map((item) => (
                <div key={item.name} className="flex justify-between gap-3">
                  <span>{item.name}</span>
                  <span className="font-fantasy font-semibold tabular-nums">{item.count}匹</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={confirmTransfer}
                className="inline-flex h-12 items-center justify-center rounded-md border-2 border-[#ff5a5a] bg-[#ff5a5a] px-5 text-sm font-bold text-black transition hover:brightness-110"
              >
                送る
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="brass-btn inline-flex h-12 items-center justify-center rounded-md px-5 text-sm font-medium"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
