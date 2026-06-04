"use client";

import { useState } from "react";
import {
  getBoxMonsters,
  getMonsterDisplayState,
  getMonsterLine,
  getPartyCount,
  getPartySlots,
  normalizeMonsterCollection,
} from "@/lib/monster";

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
}) {
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
          "flex aspect-square items-center justify-center rounded-lg border border-dashed text-2xl font-light transition",
          canReceive
            ? "border-sky-300 bg-sky-50 text-sky-400 ring-2 ring-sky-200"
            : "border-emerald-200 bg-emerald-50/70 text-emerald-200",
        ].join(" ")}
        aria-label="empty"
      >
        +
      </button>
    );
  }

  const handleClick = () => {
    if (transferMode && boxTile) onToggleTransfer(monster.id);
    else onPick(location);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={!!isSelected || !!selectedForTransfer}
      aria-label={`${current.species.name} Lv. ${current.level}`}
      className={[
        "relative flex aspect-square flex-col items-center justify-center rounded-lg border-2 p-2 transition",
        boxTile ? "bg-zinc-50 hover:bg-white" : "bg-emerald-50 hover:bg-emerald-100/70",
        buddySlot ? "border-zinc-950" : active ? "border-zinc-700" : "border-transparent",
        isSelected ? "ring-4 ring-sky-300 ring-offset-2" : "",
        selectedForTransfer ? "border-rose-500 ring-4 ring-rose-200 ring-offset-2" : "",
      ].join(" ")}
    >
      {buddySlot && (
        <span
          className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 text-[11px] font-black text-white"
          aria-hidden="true"
        >
          ★
        </span>
      )}
      {selectedForTransfer && (
        <span
          className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[11px] font-black text-white"
          aria-hidden="true"
        >
          ✓
        </span>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current.species.sprite}
        alt=""
        aria-hidden="true"
        onError={e => {
          if (e.currentTarget.src !== current.species.fallbackSprite) {
            e.currentTarget.src = current.species.fallbackSprite;
          }
        }}
        className="h-14 w-14 object-contain sm:h-16 sm:w-16"
        style={{ imageRendering: "pixelated" }}
      />
      <span className={['mt-1 max-w-full truncate text-[11px] font-medium', isHoldingItem ? 'text-sky-600' : 'text-zinc-700'].join(' ')}>
        {current.species.name}
      </span>
      <span className="text-[10px] tabular-nums text-zinc-400">Lv. {current.level}</span>
    </button>
  );
}

function BoxDropTarget({ selected, disabled, onPick }) {
  const active = selected?.area === "party" && !disabled;
  return (
    <button
      type="button"
      onClick={() => active && onPick({ area: "remove" })}
      disabled={!active}
      aria-label="send to box"
      className={[
        "mt-3 flex h-14 w-full items-center justify-center rounded-xl border-2 border-dashed transition",
        active
          ? "border-sky-300 bg-sky-50 text-sky-600 ring-2 ring-sky-200"
          : "border-zinc-200 bg-white text-zinc-300",
      ].join(" ")}
    >
      <span className="text-2xl leading-none">↓▭</span>
    </button>
  );
}

function PieMenu({ open, transferMode, onToggle, onDexSort, onLevelSort, onTransferMode }) {
  const items = [
    { label: "図鑑No順整列", icon: "No", className: "-left-16 top-0", onClick: onDexSort },
    { label: "レベル順整列", icon: "Lv", className: "top-16 left-0", onClick: onLevelSort },
    { label: "博士に送る", icon: "🧪", className: "-left-16 -top-16", onClick: onTransferMode },
  ];

  return (
    <div className="relative h-20 w-20 shrink-0">
      {open && items.map(item => (
        <button
          key={item.label}
          type="button"
          title={item.label}
          aria-label={item.label}
          onClick={item.onClick}
          className={[
            "absolute flex h-10 w-10 items-center justify-center rounded-full border text-xs font-bold shadow-sm transition",
            item.className,
            transferMode && item.label === "博士に送る"
              ? "border-rose-300 bg-rose-50 text-rose-700"
              : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50",
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
        className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 text-lg font-black text-white shadow-sm hover:bg-zinc-800"
      >
        ◌
      </button>
    </div>
  );
}

function summarizeTransfers(monsters) {
  const summary = new Map();
  for (const monster of monsters) {
    const line = getMonsterLine(monster.lineId);
    summary.set(line.id, {
      name: line.name,
      count: (summary.get(line.id)?.count ?? 0) + 1,
    });
  }
  return [...summary.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ja"));
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
}) {
  const normalized = normalizeMonsterCollection(collection);
  const partySlots = getPartySlots(normalized);
  const boxMonsters = getBoxMonsters(normalized);
  const partyCount = getPartyCount(normalized);
  const [selected, setSelected] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [requestedTransferMode, setRequestedTransferMode] = useState(false);
  const [transferIds, setTransferIds] = useState(() => new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const overLimit = boxMonsters.length > limit;
  const transferMode = requestedTransferMode || forceManage || overLimit;

  const getVisibleBoxMonsters = () => {
    const query = searchText.trim().toLocaleLowerCase("ja");
    const filtered = query
      ? boxMonsters.filter(monster => {
          const state = getMonsterDisplayState(monster);
          const line = getMonsterLine(monster.lineId);
          return [
            state.species.name,
            state.species.nameEn,
            String(state.species.id),
            line.name,
            line.id,
          ].some(value => String(value ?? "").toLocaleLowerCase("ja").includes(query));
        })
      : boxMonsters;

    return filtered;
  };
  const visibleBoxMonsters = getVisibleBoxMonsters();

  const selectedTransferMonsters = boxMonsters.filter(monster => transferIds.has(monster.id));
  const transferSummary = summarizeTransfers(selectedTransferMonsters);
  const totalTransferred = Object.values(normalized.professorTransfers ?? {}).reduce(
    (sum, count) => sum + (Number(count) || 0),
    0,
  );

  const pick = location => {
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

  const toggleTransfer = monsterId => {
    setTransferIds(prev => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border bg-white p-4 shadow-xl sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-sm font-black text-white">
              ★
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">ポケモン管理</h2>
              <p className={overLimit ? "text-sm font-semibold text-rose-600" : "text-xs text-zinc-500"}>
                ボックス {boxMonsters.length} / {limit}
                {totalTransferred > 0 && ` ・博士に送った数 ${totalTransferred}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={requestClose}
              disabled={forceManage || overLimit}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-xl leading-none text-zinc-500 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="close"
            >
              ×
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={searchText}
              onChange={event => setSearchText(event.target.value)}
              placeholder="名前・図鑑Noで検索"
              className="h-10 min-w-[200px] rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-sky-300"
            />
          </div>
        </div>

        {overLimit && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
            ボックスが上限を超えています。{boxMonsters.length - limit}匹以上を博士に送ってください。
          </div>
        )}

        <section className="rounded-xl border border-emerald-200 bg-emerald-100/50 p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 text-[11px] font-black text-white">
              ★
            </span>
            <span className="text-sm font-semibold text-emerald-950">手持ち</span>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
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

        <section className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-zinc-700">ボックス</div>
              <div className="text-xs text-zinc-500">
                通常表示
                {transferMode && ` ・博士に送る ${transferIds.size}匹選択中`}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {transferMode && (
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  disabled={transferIds.size === 0}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-40"
                >
                  博士に送る
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
              <div className="col-span-3 rounded-lg border border-dashed border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-400 sm:col-span-6">
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
          onToggle={() => setMenuOpen(open => !open)}
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
            setRequestedTransferMode(mode => !mode);
            setSelected(null);
            setMenuOpen(false);
          }}
        />
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl border bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-950">博士に送りますか？</h3>
            <p className="mt-2 text-sm text-zinc-600">
              選択した{selectedTransferMonsters.length}匹はボックスからいなくなります。
            </p>
            <div className="mt-4 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700">
              {transferSummary.map(item => (
                <div key={item.name} className="flex justify-between gap-3">
                  <span>{item.name}</span>
                  <span className="font-semibold tabular-nums">{item.count}匹</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={confirmTransfer}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-rose-600 px-5 text-sm font-medium text-white hover:bg-rose-500"
              >
                送る
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
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
