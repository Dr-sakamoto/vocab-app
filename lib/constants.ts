export const GAME = {
  PLAY_LIMIT: 10,
  INITIAL_POOL_SIZE: 113,
  /**
   * 新しい語を解放する条件（判定は lib/unlockGate.ts）。
   *
   * 見るのは1セットの正答率ではなく、定着ドーナツが表している分布そのもの。
   * 10問の出来はどの語が当たったかで揺れるので、それを解放の合図にすると
   * 「たまたま得意な10語を引いた」だけでプールが広がってしまう。実際、
   * 正答率80%で+30語という従来の設計では、解放ペース（好調なセットごとに
   * 30語）が吸収ペース（1セットあたり新出は3語弱）を10倍近く上回り、
   * プールの半分以上が一度も正解されないまま積み上がっていた。
   *
   * 2つの条件はドーナツの「中心」と「裾」に対応する：
   *   UNLOCK_AVG_LEVEL      … 平均Lv（ドーナツ中央の数字）がここまで上がったか
   *   UNLOCK_UNLEARNED_RATIO … まだ一度も正解していない語（未出題＋Lv.1）が
   *                            プールに占める割合がここまで下がったか
   *
   * 裾の条件だけだと「全語が Lv.2 で止まったまま」でも通ってしまい、
   * 中心の条件だけだと「4割を Lv.5 まで育て、6割は未出題」でも通ってしまう。
   * 両方そろって初めて「プール全体が底上げされた」と言える。
   *
   * 解放すると未正解の語が増えて条件は必ず一度崩れるので、この2つは
   * 「解放するたびに自分で締まり直す」歯止めとして働く。落ち着く先は
   * ちょうど閾値の上——つまり未正解はプールの1/4までに保たれる。
   */
  UNLOCK_AVG_LEVEL: 2,
  UNLOCK_UNLEARNED_RATIO: 0.25,
  /**
   * 1回の解放で増やす語数。
   *
   * 分布が条件を満たすかぎり毎セット解放されうるので、一度に増やす量は
   * 小さくてよい。むしろ小さいほうが、解放のたびに分布が受ける希釈が
   * 浅くなり、次の解放までの間隔が短くなる（1セットあたりに吸収できる
   * 新出語は3語弱なので、10語なら6〜7セットに1回のペースになる）。
   */
  UNLOCK_STEP: 10,
  /**
   * 結果発表が出てから「次のセットへ」を受け付けるまでの間（ミリ秒）。
   *
   * 10問を Enter／タップで送り続けた勢いは、最後の1打が余ったまま結果発表へ
   * 着地する。スマホでは10問目の直後に仮想キーボードが閉じてレイアウトが
   * 動くため、そのタップが「次のセットへ」にゴーストクリックとして届くことも
   * ある。どちらも答案を一度も読まないまま次のセットへ飛ぶ——結果発表は
   * 10問の唯一の読む場なので、ここだけは勢いで飛び越えられないようにする。
   *
   * 判定は lib/quizSet.ts の resolveResultContinue。弾いた入力は起点を
   * ずらすので、連打しているあいだは進まない（落ち着いて押し直せば通る）。
   */
  RESULT_CONTINUE_LOCK_MS: 1000,
  /**
   * 苦手パーソナライズ（重み付き抽選）を止めて、収録語全体をシャッフル順で
   * 機械的に流す周回数（判定は lib/lapOrder.ts）。
   *
   * 重み付き抽選は解放済みの狭いプールで同じ語を出し直すので、1セッションで
   * 触れる語の幅が小さく、進んでいる手応えが出にくい。まずは全語を
   * この回数だけ周回して、苦手の見極めはそのあとに回す。
   *
   * 1周に留める。周回中は誤答語も間隔反復も効かず、落とした語は次の周
   * （収録語数ぶん先、約3,400問後）まで出てこない。5周（約1.7万問）では
   * 大半の受験者が試験日までこの期間を抜けられず、苦手の出し直しが
   * 事実上止まっていた。1周で全語に一度触れれば挑戦済みとしてプールに
   * 入る（lib/vocabPool.ts）ので、周回明けは全語が重み付き抽選の対象になる。
   */
  LAP_LOCK_COUNT: 1,
  /**
   * 1日の目標セット数（lib/dailyGoal.ts）。1セットは10問なので、既定の3セットでも
   * 数分で終わる。「これだけやれば今日は勝ち」と思える小ささにする。
   */
  DAILY_GOAL_DEFAULT: 3,
  DAILY_GOAL_MIN: 1,
  DAILY_GOAL_MAX: 10,
} as const;

/**
 * 週次目標（判定は lib/weeklyGoal.ts）。週のうちこの日数プレイすれば達成。
 * 残りの日は休んでも連続達成週数は途切れない。
 */
export const WEEKLY_GOAL = {
  DAYS: 5,
} as const;

export const SOUND = {
  DEFAULT_VOLUME: 0.7,
  MIN_VOLUME: 0,
  MAX_VOLUME: 1,
} as const;

export const FLASH = {
  DEFAULT_SPEED_SEC: 1.0,
  MIN_SPEED_SEC: 0.8,
  MAX_SPEED_SEC: 2.0,
  /**
   * 苦手フラッシュ：wrong数がこの値以上で、かつまだ定着し直していない語を
   * 出題範囲に含める（スライダーで調節）。定着の判定は hasRecoveredFromMistakes。
   */
  MISTAKE_THRESHOLD_MIN: 1,
  MISTAKE_THRESHOLD_MAX: 5,
  MISTAKE_THRESHOLD_DEFAULT: 2,
} as const;

export const XP = {
  BASE_PER_CORRECT: 20,
  WEAKNESS_PER_WRONG: 30,
  WEAKNESS_CAP: 80,
  NEW_WORD: 50,
  NET_RISE: 40,
} as const;

export const STORAGE_KEYS = {
  PROGRESS: "vocab-progress",
  POOL_SIZE: "vocab-active-pool-size",
  STREAK: "vocab-daily-streak",
  SOUND_VOLUME: "vocab-sound-volume",
  PRONUNCIATION_ENABLED: "vocab-pronunciation-enabled",
  PRONUNCIATION_VOLUME: "vocab-pronunciation-volume",
  FLASH_SPEED: "vocab-flash-speed",
  MISTAKE_THRESHOLD: "vocab-mistake-threshold",
  FLASH_PROGRESS: "vocab-flash-progress",
  SYNC_BASE: "vocab-sync-base",
  DAILY_PROGRESS: "vocab-daily-progress",
  LAP_ORDER: "vocab-lap-order",
  DAILY_SETS: "vocab-daily-sets",
  DAILY_GOAL: "vocab-daily-goal",
} as const;

export const BUTTON_CLASSES = {
  PRIMARY:
    "inline-flex w-full justify-center rounded-xl bg-zinc-900 px-5 py-3 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-40 transition sm:w-auto sm:text-sm",
  SECONDARY:
    "inline-flex w-full justify-center rounded-xl border border-zinc-200 bg-white px-5 py-3 text-base font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-40 transition sm:w-auto sm:text-sm",
} as const;
