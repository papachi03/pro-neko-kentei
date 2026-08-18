/* =========================================================
 * ぷろ猫けんてい - ゲームロジック
 * =========================================================
 * 状態遷移:
 *   IDLE(タイトル) → SERVING → WAITING →
 *   (EATING | TAIL_ATTACK | MISS) → GAP → SERVING → …
 *   LIFE 0 で GAMEOVER → 検定結果
 *
 * アニメーションは Anim.*、画面表示は UI.* に分離。
 * ========================================================= */

/* ---------- 調整用定数 ---------- */
const CONFIG = {
  maxLife: 3,
  baseScore: 100,            // 食品difficulty×baseScore が基礎点
  // COMBO倍率（コンボ数しきい値の昇順）
  comboMultipliers: [
    { min: 30, mult: 2.0 },
    { min: 20, mult: 1.5 },
    { min: 10, mult: 1.25 },
    { min: 5,  mult: 1.1 },
    { min: 0,  mult: 1.0 },
  ],
  // 判断時間（ms）: 経過時間(秒)に応じて補間
  decisionTimeline: [
    { t: 0,   ms: 3000 },
    { t: 30,  ms: 2000 },
    { t: 60,  ms: 1500 },
    { t: 100, ms: 1000 },   // これ以上は短くしない（理不尽防止）
  ],
  gapAfterResolve: 450,      // 次の皿までの間隔（ms・速度で短縮）
  minSpeedScale: 0.62,       // アニメーション短縮の下限
  tickMs: 50,
};

const Game = {
  state: "IDLE",
  mode: null,
  paused: false,

  // プレイ中データ
  score: 0,
  combo: 0,
  maxCombo: 0,
  life: 3,
  elapsedMs: 0,
  waitRemaining: 0,
  gapRemaining: 0,
  currentFood: null,
  judged: false,
  recentFoodIds: [],
  recentSafeStreak: 0,
  cancelAnim: null,

  stats: null,

  init() {
    Sound.init();
    Anim.init();
    UI.init();
    UI.refreshTitleBest();
    UI.refreshMuteButtons();
    UI.refreshDifficultyButtons();
    this._bindInputs();
    this._ticker = setInterval(() => this._tick(), CONFIG.tickMs);
  },

  /* ================= 入力 ================= */
  _bindInputs() {
    // Pointer Events でタッチ・マウスを共通化。二重発火防止。
    const bindTap = (el, handler) => {
      el.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        handler();
      });
      // click は使わない（pointerdownと二重になるため）
    };

    bindTap(document.getElementById("hit-food"), () => this.onTapFood());
    bindTap(document.getElementById("hit-tail"), () => this.onTapTail());

    // タイトル（準備中モードはタップしてもゲーム開始しない）
    document.querySelectorAll(".btn-diff").forEach((btn) => {
      const mode = DIFFICULTY_MODES[btn.dataset.mode];
      btn.addEventListener("click", () => {
        if (!mode || !mode.enabled) return;
        this.start(btn.dataset.mode);
      });
    });
    document.getElementById("btn-zukan").addEventListener("click", () => UI.openZukan("title"));
    document.getElementById("btn-ranking").addEventListener("click", () => UI.openRanking());
    document.getElementById("btn-ranking-close").addEventListener("click", () => {
      UI.els.rankingOverlay.classList.remove("active");
    });
    document.getElementById("btn-zukan-back").addEventListener("click", () => UI.zukanBack());

    // 設定（音量調整をここへ集約）
    document.getElementById("btn-settings").addEventListener("click", () => {
      document.getElementById("overlay-settings").classList.add("active");
    });
    document.getElementById("btn-settings-close").addEventListener("click", () => {
      document.getElementById("overlay-settings").classList.remove("active");
    });

    // ポーズ
    document.getElementById("btn-pause").addEventListener("click", () => this.togglePause(true));
    const toggleMuteHandler = (e) => { e.preventDefault(); Sound.toggleMute(); UI.refreshMuteButtons(); };
    document.getElementById("btn-mute").addEventListener("pointerdown", toggleMuteHandler);
    document.getElementById("btn-mute-settings").addEventListener("pointerdown", toggleMuteHandler);
    document.getElementById("btn-mute-pause").addEventListener("pointerdown", toggleMuteHandler);

    const volumeSliderHandler = (e) => { Sound.setVolume(Number(e.target.value)); UI.refreshMuteButtons(); };
    document.getElementById("volume-slider-settings").addEventListener("input", volumeSliderHandler);
    document.getElementById("volume-slider-pause").addEventListener("input", volumeSliderHandler);
    document.getElementById("btn-resume").addEventListener("click", () => this.togglePause(false));
    document.getElementById("btn-quit").addEventListener("click", () => {
      this.togglePause(false);
      this._abortToTitle();
    });

    // 結果画面
    document.getElementById("btn-retry").addEventListener("click", () => this.start(this.mode.id));
    document.getElementById("btn-result-zukan").addEventListener("click", () => UI.openZukan("result"));
    document.getElementById("btn-result-title").addEventListener("click", () => {
      UI.refreshTitleBest();
      UI.show("title");
    });

    // ゲーム中のスクロール等の抑止
    document.getElementById("screen-game").addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
    document.addEventListener("contextmenu", (e) => {
      if (this.state !== "IDLE" && this.state !== "GAMEOVER") e.preventDefault();
    });
    document.addEventListener("dblclick", (e) => e.preventDefault());
  },

  /* ================= ゲーム開始 ================= */
  start(modeId) {
    Sound.startBgm(); // 最初のユーザー操作（難易度選択）でBGM再生を許可
    this.mode = DIFFICULTY_MODES[modeId] || DIFFICULTY_MODES.beginner;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.life = CONFIG.maxLife;
    this.elapsedMs = 0;
    this.currentFood = null;
    this.judged = true;
    this.paused = false;
    this.recentFoodIds = [];
    this.recentSafeStreak = 0;
    this.stats = {
      total: 0, correct: 0,
      dangerTotal: 0, dangerAvoided: 0, dangerFed: 0,
      wrongFoods: [],
    };
    if (this.cancelAnim) { this.cancelAnim(); this.cancelAnim = null; }

    UI.setScore(0);
    UI.setLife(this.life, CONFIG.maxLife);
    UI.setTime(0);
    UI.setMission(this._missionText());
    Anim.updateCombo(0);
    Anim.setCatState("idle");
    Anim.setEyes("normal");
    Anim.serveReset();
    UI.setPause(false);
    UI.show("game");
    Anim.showTapGuides(); // 開始直後だけ操作ガイドを表示し、数秒後にフェードアウト
    // ゲーム画面が実際に表示されたこのタイミングで、尻尾/食べ物のタップ判定の
    // 重なりチェックを行う（非表示中はgetBoundingClientRectが0になり判定できないため）
    Anim._ensureHitAreaGap();

    // 少し間を置いて最初の皿
    this.state = "GAP";
    this.gapRemaining = 800;
  },

  _missionText() {
    if (this.mode.id === "beginner") return "あぶない食べ物は尻尾で追い払おう！";
    if (this.mode.id === "intermediate") return "料理の中身にも気をつけよう！";
    return "材料・味付けまで考えて判断しよう！";
  },

  _abortToTitle() {
    this.state = "IDLE";
    if (this.cancelAnim) { this.cancelAnim(); this.cancelAnim = null; }
    Anim.serveReset();
    Anim.setCatState("idle");
    Anim.setEyes("normal");
    UI.refreshTitleBest();
    UI.show("title");
  },

  /* ================= メインループ ================= */
  _tick() {
    if (this.paused) return;
    if (this.state === "GAP") {
      this.elapsedMs += CONFIG.tickMs;
      this.gapRemaining -= CONFIG.tickMs;
      if (this.gapRemaining <= 0) this._serveNext();
    } else if (this.state === "WAITING") {
      this.elapsedMs += CONFIG.tickMs;
      this.waitRemaining -= CONFIG.tickMs;
      if (this.waitRemaining <= 0) this._onTimeout();
    } else if (this.state === "SERVING" || this.state === "RESOLVING") {
      this.elapsedMs += CONFIG.tickMs;
    }
    if (this.state !== "IDLE" && this.state !== "GAMEOVER") {
      UI.setTime(this.elapsedMs / 1000);
    }
  },

  /** 経過時間に応じた判断時間（ms） */
  _decisionTime() {
    const t = this.elapsedMs / 1000;
    const tl = CONFIG.decisionTimeline;
    if (t <= tl[0].t) return tl[0].ms;
    for (let i = 1; i < tl.length; i++) {
      if (t <= tl[i].t) {
        const a = tl[i - 1], b = tl[i];
        const r = (t - a.t) / (b.t - a.t);
        return a.ms + (b.ms - a.ms) * r;
      }
    }
    return tl[tl.length - 1].ms;
  },

  /** アニメーション速度係数（1.0=通常、進行で短縮） */
  _speedScale() {
    const s = this._decisionTime() / CONFIG.decisionTimeline[0].ms;
    return Math.max(CONFIG.minSpeedScale, s);
  },

  /* ================= 出題 ================= */
  _pickFood() {
    // レベル別出題（中級・上級はデータが揃うまで初級への流用はしない。
    // enabled:falseのモードはそもそもstart()に到達しないため、ここでは
    // 常にthis.mode.levelに一致する食品のみを対象にする）
    const pool = FOODS.filter((f) => f.level === this.mode.level);
    // 直近2つと同じ食品は避ける
    let candidates = pool.filter((f) => !this.recentFoodIds.slice(-2).includes(f.id));
    if (candidates.length === 0) candidates = pool;

    // 「安全に慣れたところへ危険」：安全が続くほど危険（caution/danger）の確率を上げる
    let dangerProb = 0.4;
    if (this.recentSafeStreak >= 3) dangerProb = 0.75;
    else if (this.recentSafeStreak >= 2) dangerProb = 0.55;

    const wantDanger = Math.random() < dangerProb;
    const group = candidates.filter((f) =>
      wantDanger ? f.risk !== "safe" : f.risk === "safe"
    );
    const finalPool = group.length > 0 ? group : candidates;
    const food = finalPool[Math.floor(Math.random() * finalPool.length)];

    this.recentFoodIds.push(food.id);
    if (this.recentFoodIds.length > 4) this.recentFoodIds.shift();
    if (food.risk === "safe") this.recentSafeStreak++;
    else this.recentSafeStreak = 0;
    return food;
  },

  _serveNext() {
    if (this.life <= 0) return;
    this.state = "SERVING";
    this.currentFood = this._pickFood();
    this.judged = false;
    Storage.discoverFood(this.currentFood.id); // 図鑑登録

    Anim.serveIn(this.currentFood, this._speedScale(), () => {
      if (this.state === "SERVING") {
        this.state = "WAITING";
        this.waitRemaining = this._decisionTime();
      }
    });
  },

  /* ================= 判定 ================= */
  onTapFood() {
    if (this.paused) return;
    if (this.state !== "WAITING" && this.state !== "SERVING") return;
    if (this.judged || !this.currentFood) return;
    this.judged = true;
    this._resolve("eat");
  },

  onTapTail() {
    if (this.paused) return;
    if (this.state !== "WAITING" && this.state !== "SERVING") return;
    if (this.judged || !this.currentFood) return;
    this.judged = true;
    this._resolve("flick");
  },

  _resolve(action) {
    this.state = "RESOLVING";
    const food = this.currentFood;
    const correct = correctActionFor(food) === action;
    const isDangerFood = food.risk !== "safe";
    const s = this._speedScale();

    this.stats.total++;
    if (isDangerFood) this.stats.dangerTotal++;

    if (action === "eat") {
      // 猫が食べる（正解でもミスでも食べてしまう。hazure音は✕マーク表示と同時に_onMissで再生）
      this.cancelAnim = Anim.playEat(s, () => {
        this.cancelAnim = null;
        if (correct) this._onCorrect(food);
        else this._onMiss(food, "ate_danger");
        this._retreatAndNext(s);
      });
      if (!correct) this.stats.dangerFed++;
      else this.stats.correct++;
    } else {
      // 尻尾でバチコーン（正解でもミスでも吹き飛ぶ）
      this.cancelAnim = Anim.playTailAttack(s, () => {
        this.cancelAnim = null;
        if (correct) {
          this.stats.dangerAvoided++;
          this._onCorrect(food);
        } else {
          this._onMiss(food, "flicked_safe");
        }
        this._retreatAndNext(s, true);
      });
      if (correct) this.stats.correct++;
    }
  },

  _onCorrect(food) {
    const mult = this._comboMultiplier(this.combo + 1);
    const points = Math.round(CONFIG.baseScore * food.difficultyLevel * mult);
    this.score += points;
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    UI.setScore(this.score);
    Anim.updateCombo(this.combo);
    Anim.showJudge(true);
    Anim.showScorePop(points);
    // 節目演出（5/10/20/30/40…10刻み）
    if (this.combo === 5 || (this.combo >= 10 && this.combo % 10 === 0)) {
      Anim.showComboMilestone(this.combo);
    }
    // 高COMBO時は正解のたびに軽いパルス
    if (Anim.comboTierFor(this.combo) >= 3) Anim.pulseStage();
  },

  _onMiss(food, kind) {
    const prevCombo = this.combo;
    this.combo = 0;
    this.life--;
    this.stats.wrongFoods.push({ food, kind });

    UI.setLife(this.life, CONFIG.maxLife);
    Anim.comboLost(prevCombo);
    Anim.showJudge(false);
    // ✕マーク表示と同時にhazure音を鳴らす（ミスの種類を問わず共通）
    Sound.play("hazure");
    Anim.playMiss(() => {});

    if (this.life <= 0) {
      // ゲームオーバー（皿が引っ込んでから結果へ）
      setTimeout(() => this._gameOver(), 900);
    }
  },

  _comboMultiplier(combo) {
    for (const m of CONFIG.comboMultipliers) {
      if (combo >= m.min) return m.mult;
    }
    return 1.0;
  },

  _retreatAndNext(speedScale, foodFlew = false) {
    if (this.life <= 0) {
      Anim.serveOut(speedScale, () => {});
      return;
    }
    Anim.serveOut(speedScale, () => {
      this.state = "GAP";
      this.gapRemaining = CONFIG.gapAfterResolve * speedScale;
    });
  },

  /* ================= 時間切れ ================= */
  _onTimeout() {
    if (this.judged) return;
    this.judged = true;
    this.state = "RESOLVING";
    const food = this.currentFood;
    const s = this._speedScale();

    // 時間切れもミス扱い（判断できなかった）
    this.stats.total++;
    if (food.risk !== "safe") this.stats.dangerTotal++;
    this._onMiss(food, "timeout");
    this._retreatAndNext(s);
  },

  /* ================= ポーズ ================= */
  togglePause(active) {
    if (this.state === "IDLE" || this.state === "GAMEOVER") return;
    this.paused = active;
    UI.setPause(active);
  },

  /* ================= ゲームオーバー → 検定 ================= */
  _gameOver() {
    this.state = "GAMEOVER";
    const st = this.stats;
    const accuracy = st.total > 0 ? st.correct / st.total : 0;

    const rankEval = evaluateRank({
      total: st.total,
      correct: st.correct,
      score: this.score,
      maxCombo: this.maxCombo,
      dangerFed: st.dangerFed,
      difficultyWeight: this.mode.difficultyWeight,
    });

    const saveResult = Storage.recordResult({
      score: this.score,
      maxCombo: this.maxCombo,
      accuracy,
      rankIndex: rankEval.rankIndex,
      modeId: this.mode.id,
      composite: rankEval.compositeScore,
    });

    UI.showResult({
      rankEval,
      saveResult,
      wrongFoods: st.wrongFoods,
      mode: this.mode,
      stats: {
        total: st.total,
        correct: st.correct,
        score: this.score,
        maxCombo: this.maxCombo,
        dangerTotal: st.dangerTotal,
        dangerAvoided: st.dangerAvoided,
        dangerFed: st.dangerFed,
      },
    });
  },
};

window.addEventListener("DOMContentLoaded", () => Game.init());
