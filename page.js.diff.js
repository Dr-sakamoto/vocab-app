// ── 3. スタート画面JSXの中にSyncButtonを追加 ──
// 既存の「進捗を見る」ボタンの隣（または下）に追加:

/*
  <SyncButton
    stats={stats}
    unlockedPoolSize={unlockedPoolSize}
    monsterTotalXP={monsterTotalXP}
    onMerged={handleMerged}
  />
*/

// 具体的には start ビューの div className="mt-6 flex flex-col ..." の中へ:
//
//   <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
//     <button onClick={startGame}>1プレイ開始</button>
//     <button onClick={() => openDashboard("start")}>進捗を見る</button>
//     <SyncButton                              ← ここを追加
//       stats={stats}
//       unlockedPoolSize={unlockedPoolSize}
//       monsterTotalXP={monsterTotalXP}
//       onMerged={handleMerged}
//     />
//   </div>