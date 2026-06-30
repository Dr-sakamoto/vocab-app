import { getPoolTier } from "./monster.js";
import { XP } from "./constants.js";
// ── グレード定義（プロセス・状態重視） ────────────────────────────────────
const GRADES = [
    { minAccuracy: 1.0, grade: "S", title: "ゾーン突入", message: "完璧な集中状態！この感覚を覚えておこう。" },
    { minAccuracy: 0.8, grade: "A", title: "フロー状態", message: "脳がノってる。このリズムが本物の学習だ。" },
    { minAccuracy: 0.6, grade: "B", title: "適度な挑戦", message: "難しさと実力が釣り合ってる。成長の黄金ゾーン。" },
    { minAccuracy: 0.4, grade: "C", title: "脳が抵抗中", message: "まだ固まっていない単語が多い。それが今日の収穫。" },
    { minAccuracy: 0, grade: "D", title: "インプット段階", message: "知らない言葉と出会えた。記憶は繰り返しで作られる。" },
];
// ── フローゾーン係数 ───────────────────────────────────────────────────────
function flowZoneMultiplier(playCount = 1) {
    if (playCount >= 5)
        return 1.5;
    if (playCount === 4)
        return 1.4;
    if (playCount === 3)
        return 1.3;
    if (playCount === 2)
        return 1.2;
    return 1.1; // 1回目
}
function computeWeaknessBonus(answers, multiplier) {
    const recovered = answers.filter(a => a.correct && a.previousWrong > 0);
    if (recovered.length === 0)
        return { points: 0, detail: null };
    const raw = recovered.reduce((sum, a) => sum + Math.min(a.previousWrong * XP.WEAKNESS_PER_WRONG, XP.WEAKNESS_CAP), 0);
    return {
        points: Math.round(raw * multiplier),
        detail: `苦手単語 ${recovered.length}語を正解に転換`,
    };
}
function computeNewWordBonus(answers, multiplier) {
    const newCorrect = answers.filter(a => a.correct && a.previousCorrect === 0 && a.previousWrong === 0);
    if (newCorrect.length === 0)
        return { points: 0, detail: null };
    return {
        points: Math.round(newCorrect.length * XP.NEW_WORD * multiplier),
        detail: `初見で正解 ${newCorrect.length}語`,
    };
}
function computeNetRiseBonus(answers, multiplier) {
    const risen = answers.filter(a => a.correct && (a.previousCorrect - a.previousWrong) <= 0);
    if (risen.length === 0)
        return { points: 0, detail: null };
    return {
        points: Math.round(risen.length * XP.NET_RISE * multiplier),
        detail: `${risen.length}語の定着スコアがプラス転換`,
    };
}
function computeAllXP({ answers, score, playLimit, unlockedPoolSize, playCount = 1, }) {
    const tier = getPoolTier(unlockedPoolSize);
    const { multiplier } = tier;
    const accuracy = playLimit > 0 ? score / playLimit : 0;
    const fzm = flowZoneMultiplier(playCount);
    // 基本XP
    const baseXP = Math.round(score * XP.BASE_PER_CORRECT * multiplier * fzm);
    // 質ボーナス
    const weakness = answers ? computeWeaknessBonus(answers, multiplier) : { points: 0, detail: null };
    const newWord = answers ? computeNewWordBonus(answers, multiplier) : { points: 0, detail: null };
    const netRise = answers ? computeNetRiseBonus(answers, multiplier) : { points: 0, detail: null };
    const totalXP = baseXP + weakness.points + newWord.points + netRise.points;
    return { baseXP, weakness, newWord, netRise, totalXP, tier, fzm, multiplier, accuracy };
}
export function computeSessionXP({ answers, score, unlockedPoolSize, playLimit, playCount = 1, }) {
    const { totalXP, tier } = computeAllXP({ answers, score, playLimit, unlockedPoolSize, playCount });
    return { baseXP: 0, streakXP: 0, totalXP, tier };
}
export function evaluatePlay({ answers, score, playLimit, bestStreak, unlockedPoolSize, playCount = 1, }) {
    const accuracy = playLimit > 0 ? score / playLimit : 0;
    const gradeEntry = GRADES.find(g => accuracy >= g.minAccuracy) ?? GRADES.at(-1);
    const { baseXP, weakness, newWord, netRise, totalXP, tier, fzm, multiplier } = computeAllXP({ answers, score, playLimit, unlockedPoolSize, playCount });
    const breakdown = [
        {
            label: "正解ボーナス",
            points: baseXP,
            max: Math.round(playLimit * XP.BASE_PER_CORRECT * multiplier * 1.5),
            detail: `${score}問正解 × ${XP.BASE_PER_CORRECT} × ${multiplier} (${tier.label})`
                + (fzm !== 1.0 ? ` × フロー係数${fzm}` : ""),
        },
        ...(weakness.points > 0 ? [{
                label: "🔁 苦手回収",
                points: weakness.points,
                max: null,
                detail: weakness.detail,
            }] : []),
        ...(newWord.points > 0 ? [{
                label: "✨ 新単語初見正解",
                points: newWord.points,
                max: null,
                detail: newWord.detail,
            }] : []),
        ...(netRise.points > 0 ? [{
                label: "📈 定着スコア上昇",
                points: netRise.points,
                max: null,
                detail: netRise.detail,
            }] : []),
    ];
    return {
        grade: gradeEntry.grade,
        title: gradeEntry.title,
        message: gradeEntry.message,
        xp: totalXP,
        tier,
        fzm,
        breakdown,
    };
}
