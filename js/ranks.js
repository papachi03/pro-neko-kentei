/* =========================================================
 * ぷろ猫けんてい - 級位・段位システム
 * =========================================================
 * 八級（最下位）〜八段（最高位）の16段階。
 * 評価は反射神経だけで決まらないよう、
 * 正答率・問題難易度・SCORE・最大COMBO の重み付き総合評価。
 * 危険食品を食べさせたミスは追加ペナルティで大きく影響する。
 * 数値はすべて定数として調整可能。
 * ========================================================= */

// index が大きいほど上位。八段(index 15)が最高位。
const RANKS = [
  { id: "kyu8",  label: "八級", title: "猫との暮らし入門",   grade: "kyu" },
  { id: "kyu7",  label: "七級", title: "駆け出し猫飼い",     grade: "kyu" },
  { id: "kyu6",  label: "六級", title: "猫のお世話見習い",   grade: "kyu" },
  { id: "kyu5",  label: "五級", title: "猫の食事勉強中",     grade: "kyu" },
  { id: "kyu4",  label: "四級", title: "猫の健康意識あり",   grade: "kyu" },
  { id: "kyu3",  label: "三級", title: "猫の危険察知初級",   grade: "kyu" },
  { id: "kyu2",  label: "二級", title: "猫の危険察知上級",   grade: "kyu" },
  { id: "kyu1",  label: "一級", title: "かなり頼れる猫飼い", grade: "kyu" },
  { id: "dan1",  label: "初段", title: "ぷろ猫への入口",     grade: "dan" },
  { id: "dan2",  label: "二段", title: "猫知識にかなり強い", grade: "dan" },
  { id: "dan3",  label: "三段", title: "危険食材を見抜ける", grade: "dan" },
  { id: "dan4",  label: "四段", title: "料理まで判断できる", grade: "dan" },
  { id: "dan5",  label: "五段", title: "猫の健康管理上級者", grade: "dan" },
  { id: "dan6",  label: "六段", title: "高度な危機管理能力", grade: "dan" },
  { id: "dan7",  label: "七段", title: "猫博士クラス",       grade: "dan" },
  { id: "dan8",  label: "八段", title: "ぷろ猫マスター",     grade: "dan" },
];

// ---- 評価の重み（合計 1.0）----
// 2026-08-19: 正答率は仕様上ミス3回までしか許されずほぼ97〜99%に張り付くため
// 弁別力が低く、SCORE・COMBOの重みを大きく引き上げるよう調整。
const RANK_WEIGHTS = {
  accuracy: 0.10,   // 正答率
  difficulty: 0.20, // 問題難易度
  score: 0.45,      // SCORE
  combo: 0.25,      // 最大COMBO
};

// 危険食品を食べさせてしまったミス1回あたりの減点（総合スコア100点満点中）
const DANGER_FED_PENALTY = 8;

// スコア・COMBOの正規化上限（これ以上は満点扱い）
const RANK_SCORE_CAP = 200000;
const RANK_COMBO_CAP = 200;

// 評価に必要な最低問題数（少なすぎるプレイで高評価にならないための補正）
const RANK_MIN_QUESTIONS = 20;

// 総合スコア(0-100)→ランクindex(0-15)のしきい値
// RANK_THRESHOLDS[i] 以上で RANKS[i] に認定。
const RANK_THRESHOLDS = [0, 12, 20, 28, 36, 44, 52, 60, 68, 74, 80, 85, 89, 93, 96, 99];

/**
 * プレイ結果から級位・段位を算出する。
 * @param {object} stats
 *   total        … 出題数
 *   correct      … 正解数
 *   score        … SCORE
 *   maxCombo     … 最大COMBO
 *   dangerFed    … 危険食品を食べさせてしまった回数
 *   difficultyWeight … 難易度係数 (DIFFICULTY_MODES[].difficultyWeight)
 * @returns {{rankIndex:number, rank:object, compositeScore:number, breakdown:object}}
 */
function evaluateRank(stats) {
  const total = Math.max(0, stats.total | 0);
  const correct = Math.max(0, stats.correct | 0);

  const accuracy = total > 0 ? correct / total : 0;                 // 0-1
  const difficultyNorm = Math.min(1, (stats.difficultyWeight - 1.0) / 0.5); // 初級0 / 中級0.5 / 上級1
  const scoreNorm = Math.min(1, stats.score / RANK_SCORE_CAP);      // 0-1
  const comboNorm = Math.min(1, stats.maxCombo / RANK_COMBO_CAP);   // 0-1

  let composite =
    accuracy * RANK_WEIGHTS.accuracy * 100 +
    difficultyNorm * RANK_WEIGHTS.difficulty * 100 +
    scoreNorm * RANK_WEIGHTS.score * 100 +
    comboNorm * RANK_WEIGHTS.combo * 100;

  // 危険食品を食べさせたミスは大きく減点
  composite -= (stats.dangerFed | 0) * DANGER_FED_PENALTY;

  // 出題数が少なすぎる場合の補正（少数問題での偶発的高評価を防ぐ）
  if (total < RANK_MIN_QUESTIONS) {
    composite *= total / RANK_MIN_QUESTIONS;
  }

  composite = Math.max(0, Math.min(100, composite));

  let rankIndex = 0;
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (composite >= RANK_THRESHOLDS[i]) { rankIndex = i; break; }
  }

  return {
    rankIndex,
    rank: RANKS[rankIndex],
    compositeScore: composite,
    breakdown: {
      accuracy, difficultyNorm, scoreNorm, comboNorm,
      dangerFed: stats.dangerFed | 0,
    },
  };
}

/**
 * 次の階級までの進捗（0-1）と次ランクを返す。八段なら next=null。
 */
function rankProgress(compositeScore, rankIndex) {
  if (rankIndex >= RANKS.length - 1) {
    return { next: null, progress: 1 };
  }
  const cur = RANK_THRESHOLDS[rankIndex];
  const next = RANK_THRESHOLDS[rankIndex + 1];
  const progress = Math.max(0, Math.min(1, (compositeScore - cur) / (next - cur)));
  return { next: RANKS[rankIndex + 1], progress };
}
