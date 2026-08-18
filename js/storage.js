/* =========================================================
 * ぷろ猫けんてい - 保存 (localStorage)
 * =========================================================
 * 保存データが壊れていてもゲームが起動不能にならないよう、
 * すべて try/catch + デフォルト値で防御する。
 * ========================================================= */

const STORAGE_KEY = "puro-neko-kentei-v1";

const DEFAULT_SAVE = {
  highScore: 0,
  bestCombo: 0,
  bestAccuracy: 0,        // 0-1
  bestRankIndex: -1,      // -1 = 未認定
  history: [],            // 過去の認定結果（最新20件）
  discoveredFoods: [],    // 遭遇済み食品id（図鑑解放）
  settings: {},
};

const Storage = {
  _cache: null,

  load() {
    if (this._cache) return this._cache;
    let data = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) data = JSON.parse(raw);
    } catch (e) {
      // 壊れたデータ・localStorage不可はデフォルトで続行
      data = null;
    }
    if (!data || typeof data !== "object") data = {};
    // 欠損キーをデフォルトで補完（部分的に壊れていても起動可能に）
    this._cache = Object.assign({}, DEFAULT_SAVE, data);
    if (!Array.isArray(this._cache.history)) this._cache.history = [];
    if (!Array.isArray(this._cache.discoveredFoods)) this._cache.discoveredFoods = [];
    if (typeof this._cache.settings !== "object" || !this._cache.settings) this._cache.settings = {};
    return this._cache;
  },

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._cache || DEFAULT_SAVE));
    } catch (e) {
      // 保存不可でもゲームは継続
    }
  },

  /** 食品を図鑑に登録。新規登録なら true */
  discoverFood(foodId) {
    const s = this.load();
    if (!s.discoveredFoods.includes(foodId)) {
      s.discoveredFoods.push(foodId);
      this.save();
      return true;
    }
    return false;
  },

  isDiscovered(foodId) {
    return this.load().discoveredFoods.includes(foodId);
  },

  /**
   * プレイ結果を記録し、更新項目を返す。
   * @returns {{newHighScore:boolean, newBestCombo:boolean, newBestRank:boolean, prevBestRankIndex:number}}
   */
  recordResult({ score, maxCombo, accuracy, rankIndex, modeId, composite }) {
    const s = this.load();
    const prevBestRankIndex = s.bestRankIndex;
    const result = {
      newHighScore: false,
      newBestCombo: false,
      newBestRank: false,
      prevBestRankIndex,
    };
    if (score > s.highScore) { s.highScore = score; result.newHighScore = true; }
    if (maxCombo > s.bestCombo) { s.bestCombo = maxCombo; result.newBestCombo = true; }
    if (accuracy > s.bestAccuracy) { s.bestAccuracy = accuracy; }
    if (rankIndex > s.bestRankIndex) { s.bestRankIndex = rankIndex; result.newBestRank = true; }
    s.history.unshift({
      date: new Date().toISOString(),
      score, maxCombo, accuracy, rankIndex, modeId, composite,
    });
    s.history = s.history.slice(0, 20);
    this.save();
    return result;
  },
};
