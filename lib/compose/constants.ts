export const COMPOSE = {
  /**
   * 1セッションの問題数。
   *
   * 単語アプリの10問と違い、こちらは1問ごとに添削を読む前提の学習なので、
   * 短く区切る。5問でも「書く→読む」を5往復するので、体感の負荷は
   * 単語10問より重い。息切れして毎日開かなくなるほうが損失が大きい。
   */
  DEFAULT_SET_SIZE: 5,
  SET_SIZE_OPTIONS: [3, 5, 8] as const,

  /** これ以上を「合格」とする。復習間隔の段を上げる条件でもある */
  PASS_SCORE: 80,
  /** これ以上なら「惜しい」。下回ると「要復習」 */
  CLOSE_SCORE: 60,

  /** 1答案の入力上限。AIプロンプトに載る文字数の歯止め */
  MAX_INPUT_LENGTH: 400,

  /** 端末に残す答案の件数。分析画面の「直近の答案」の母数 */
  HISTORY_LIMIT: 60,

  /**
   * 1セッション内で同じタグを出す上限。
   * 弱点特訓でも、1つのタグだけで埋めると「その日できなかったこと」が
   * 1点に集中して、続ける気力のほうが先に切れる。
   */
  MAX_SAME_TAG_PER_SET: 2,

  /**
   * 習熟度の平均に使う指数移動平均の係数（直近の1回が占める重み）。
   * 0.4 は「直近3回でおよそ8割が入れ替わる」速さ。学習の伸びを
   * 見失わない程度に速く、1回の事故で弱点判定がひっくり返らない程度に遅い。
   */
  EMA_ALPHA: 0.4,

  /**
   * 習熟度の縮小推定（lib/compose/mastery.ts）。
   * 答案が少ないタグは「中庸（PRIOR_MASTERY）」の方へ引き戻して、
   * 1回の高得点で「得意」と判定してしまわないようにする。
   */
  PRIOR_MASTERY: 50,
  PRIOR_WEIGHT: 2,

  /** 弱点として画面に出すタグ数 */
  WEAK_TAG_DISPLAY: 3,
} as const;

export const COMPOSE_STORAGE_KEYS = {
  PROGRESS: "compose-progress",
  SETTINGS: "compose-settings",
  STREAK: "compose-daily-streak",
} as const;
