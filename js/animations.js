/* =========================================================
 * ぷろ猫けんてい - アニメーション制御（PNGパーツ合成方式）
 * =========================================================
 * 正式デザイン: assets/cat/master/cat_master.png
 * 猫は tail / body / head の3枚のPNGを重ね合わせて表示し、
 * 状態に応じて画像を切り替える。
 *   通常レイヤー: head(3) > body(2) > tail(1)
 *   攻撃中のみ  : tail(5) > head(3) > body(2)  (.attacking)
 * ゲームロジック(game.js)からは従来どおり
 * Anim.setCatState / playEat / playTailAttack / ... を呼ぶだけ。
 * ========================================================= */

const CAT_PARTS = {
  body: "assets/cat/parts/body.png",
  head_idle: "assets/cat/parts/head_idle.png",
  head_eat_01: "assets/cat/parts/head_eat_01.png",
  head_eat_02: "assets/cat/parts/head_eat_02.png",
  head_happy: "assets/cat/parts/head_happy.png",
  head_tail_attack: "assets/cat/parts/head_tail_attack.png",
  tail_idle: "assets/cat/parts/tail_idle.png",
  tail_ready: "assets/cat/parts/tail_ready.png",
  tail_swing: "assets/cat/parts/tail_swing.png",
  tail_return: "assets/cat/parts/tail_return.png",
};

/* 表情ごとの配置補正。
 * 画像ごとに余白・縦横比が異なるため、顔の輪郭幅と顎の位置が
 * head_idle と一致するように left/top/width(%) を補正する。
 * （各PNGの不透明領域の実測値から算出。微調整はここを変更）*/
/* t(top)値は cat-body を影に近づけるため -4%→+4% ぶん下げた分だけ、
 * 首の接続を保つよう同じ量を加算している（2026-08-19調整） */
const HEAD_LAYOUT = {
  head_idle:        { l: 8.0,  t: 10.0, w: 76.0, clip: null },
  head_eat_01:      { l: 5.3,  t: 13.7, w: 81.7, clip: "inset(0 0 3% 0)" },
  head_eat_02:      { l: 6.9,  t: 15.8, w: 78.3, clip: "inset(0 0 3% 0)" },
  head_happy:       { l: 6.0,  t: 15.0, w: 79.6, clip: "inset(0 0 3% 0)" },
  head_tail_attack: { l: 8.0,  t: 12.0, w: 76.0, clip: null },
};

/* 猫の右腰アンカー（wrap座標 %）。全ての尻尾素材の付け根をこの1点に固定する。
 * wrap は aspect-ratio 1211/1299 の絶対配置ボックス。 */
const HIP_ANCHOR = { left: 69, top: 82 };
const WRAP_ASPECT = 1211 / 1299; // wrap width / wrap height

/* 尻尾素材ごとのユーザー指示による追加オフセット（px）。位置がズレて見える場合はここで微調整 */
const TAIL_PX_OFFSET = {
  tail_swing: { x: -15, y: 25 },
  tail_return: { x: -10, y: 15 },
};

/* 尻尾素材ごとの実測ピボット（画像内の付け根位置。fraction of own intrinsic size）。
 * PowerShellでの画素解析により算出（本体との接続部分の重心座標）。 */
const TAIL_PIVOT = {
  tail_idle:   { x: 559.3 / 1244, y: 245.9  / 1265, w: 1244, h: 1265 },
  tail_ready:  { x: 580.7 / 1346, y: 179.2  / 1169, w: 1346, h: 1169 },
  tail_swing:  { x: 315.6 / 378,  y: 185.7  / 311,  w: 378,  h: 311 },
  tail_return: { x: 581.9 / 1266, y: 1026.1 / 1242, w: 1266, h: 1242 },
};
/* 各尻尾状態の表示幅（wrap幅に対する%）。
 * 2026-08-19: 弾く(swing)動作のみユーザー指示でさらに50%縮小。
 * idle/ready/returnは通常サイズのまま。 */
const TAIL_WIDTH = {
  tail_idle: 40, tail_ready: 40, tail_swing: 60, tail_return: 40,
};

/* ---------- COMBOマイルストーン演出：文言設定 ----------
 * ここを書き換えるだけでCOMBO達成時のサブメッセージを変更できる。
 * キーが存在しない到達値は「◯ COMBO!」のみ表示する
 * （ただしLEVEL3=100の倍数だけは、個別文言が無い場合に既定文言を使う）。 */
const COMBO_MILESTONE_MESSAGES = {
  10: "いい調子！",
  20: "その調子！",
  30: "判断がはやい！",
  50: "ぷろ猫級！",
  100: "ぷろ猫マスター！",
};
const COMBO_LEVEL3_FALLBACK_MESSAGE = "ぷろ猫マスター！"; // 200,300…用の既定文言

const Anim = {
  els: {},
  _munchTimer: null,
  _lastMilestoneCombo: 0, // 同じCOMBO値でのマイルストーン演出二重発火を防ぐ

  init() {
    this.els = {
      catWrap: document.getElementById("cat-wrap"),
      stage: document.getElementById("stage"),
      tray: document.getElementById("serve-tray"),
      food: document.getElementById("food-display"),
      foodImg: document.getElementById("food-display-img"),
      eatLayer: document.getElementById("eat-effect-layer"),
      impact: document.getElementById("impact-effect"),
      comboLayer: document.getElementById("combo-banner-layer"),
      comboBox: document.getElementById("hud-combo-box"),
      comboValue: document.getElementById("hud-combo"),
      head: document.getElementById("cat-head"),
      body: document.getElementById("cat-body"),
      tail: document.getElementById("cat-tail"),
      guideTail: document.getElementById("guide-tail"),
      guideFood: document.getElementById("guide-food"),
      foodNameTag: document.getElementById("food-name-tag"),
    };
    // 全パーツをプリロード（初回切替のチラつき防止）
    Object.values(CAT_PARTS).forEach((src) => { const img = new Image(); img.src = src; });
    this.setCatState("idle");

    // 尻尾/食べ物のタップ判定は猫(cat-wrap)と皿(serve-tray)という別々の
    // 要素からCSSの%で計算されるため、画面の縦横比（実機のアドレスバー等で
    // 縦の表示領域が短い場合など）によっては再び重なってしまうことがある。
    // CSSの比率調整だけに頼らず、実際に描画された座標を測定して
    // 確実に重ならないよう補正する。
    this._ensureHitAreaGap();
    if (!this._hitAreaResizeBound) {
      this._hitAreaResizeBound = true;
      window.addEventListener("resize", () => this._ensureHitAreaGap());
      window.addEventListener("orientationchange", () => setTimeout(() => this._ensureHitAreaGap(), 200));
    }
  },

  /** #hit-tail と #hit-food が重ならないよう、実測して動的に補正する。
   * 尻尾タップは実機でシビアになりやすいため #hit-tail を最優先の固定領域とし、
   * 高さ・幅とも一切縮めない。重なりが出た場合は #hit-food 側だけを
   * （尻尾の左端を避けるよう、右端→必要なら左端も）自動で縮めて避ける。 */
  _ensureHitAreaGap(minGapPx = 14) {
    const hitTail = document.getElementById("hit-tail");
    const hitFood = document.getElementById("hit-food");
    if (!hitTail || !hitFood) return;
    // hit-foodのみ一旦CSS既定値へ戻してから測り直す（前回の補正が残ったままだと正しく測れないため）
    // hit-tailは常にCSS既定値のまま＝最優先領域として一切変更しない
    hitFood.style.left = "";
    hitFood.style.width = "";
    const tr = hitTail.getBoundingClientRect();
    const fr = hitFood.getBoundingClientRect();
    const verticalOverlap = !(fr.bottom <= tr.top || tr.bottom <= fr.top);
    if (!verticalOverlap) return; // 上下が重ならない配置なら補正不要
    if (tr.left - fr.right >= minGapPx) return; // すでに尻尾の左に十分な余白がある

    // hit-foodの右端を「尻尾の左端 - minGap」まで縮める（左端はできる限り動かさない）
    const MIN_FOOD_W = 130; // お皿の食品を覆うのに必要な最低幅
    const parentLeft = hitFood.offsetParent.getBoundingClientRect().left;
    const newRightPx = tr.left - minGapPx - parentLeft;
    let leftPx = fr.left - parentLeft;
    let newWidth = newRightPx - leftPx;
    if (newWidth < MIN_FOOD_W) {
      // 幅が足りない場合は左端も詰めて最低幅を確保する
      newWidth = MIN_FOOD_W;
      leftPx = newRightPx - newWidth;
    }
    hitFood.style.left = leftPx + "px";
    hitFood.style.width = newWidth + "px";
  },

  /* ---------- パーツ切替ヘルパー ---------- */
  _setHead(key) {
    const src = CAT_PARTS[key];
    const h = this.els.head;
    if (h.getAttribute("src") !== src) h.src = src;
    const lay = HEAD_LAYOUT[key];
    if (lay) {
      h.style.left = lay.l + "%";
      h.style.top = lay.t + "%";
      h.style.width = lay.w + "%";
      h.style.clipPath = lay.clip || "";
    }
  },
  _setTail(key) {
    const src = CAT_PARTS[key];
    const t = this.els.tail;
    if (t.getAttribute("src") !== src) t.src = src;
    this._layoutTail(key);
  },
  /** 尻尾の付け根(HIP_ANCHOR)が画像内ピボットと一致するよう left/top/width/transform-origin を計算配置する */
  _layoutTail(key) {
    const t = this.els.tail;
    const piv = TAIL_PIVOT[key];
    if (!piv) return;
    const widthPct = TAIL_WIDTH[key] || 40;
    const heightPct = widthPct * (piv.h / piv.w) * WRAP_ASPECT;
    let leftPct = HIP_ANCHOR.left - piv.x * widthPct;
    let topPct = HIP_ANCHOR.top - piv.y * heightPct;
    const pxOffset = TAIL_PX_OFFSET[key];
    if (pxOffset) {
      const wrapRect = this.els.catWrap.getBoundingClientRect();
      const wrapWidthPx = wrapRect.width || 360;
      const wrapHeightPx = wrapRect.height || 386;
      if (pxOffset.x) leftPct += (pxOffset.x / wrapWidthPx) * 100;
      if (pxOffset.y) topPct += (pxOffset.y / wrapHeightPx) * 100;
    }
    t.style.left = leftPct + "%";
    t.style.top = topPct + "%";
    t.style.width = widthPct + "%";
    t.style.transformOrigin = (piv.x * 100) + "% " + (piv.y * 100) + "%";
  },
  _setTailPhase(phase) {
    // phase: null | "ready" | "swing" | "return"
    // レイアウトは _setTail が画像切替のたびに計算するため、ここではCSSアニメの発火のみ行う
    const t = this.els.tail;
    t.classList.remove("phase-ready", "phase-swing", "phase-return");
    if (phase) t.classList.add("phase-" + phase);
  },
  _stopMunch() {
    if (this._munchTimer) { clearInterval(this._munchTimer); this._munchTimer = null; }
  },

  /* ---------- 操作ガイド（tap_food.png / tap_sippo.png） ----------
   * ゲーム中はずっと表示したままにする視覚サポート（タップしやすいよう自動では消さない）。
   * タップ判定には一切関与しない（判定は既存の #hit-food / #hit-tail のまま）。 */
  _guideTimer: null,
  showTapGuides() {
    if (this._guideTimer) clearTimeout(this._guideTimer);
    this.els.guideTail.classList.remove("guide-hidden");
    this.els.guideFood.classList.remove("guide-hidden");
  },
  hideTapGuidesNow() {
    if (this._guideTimer) clearTimeout(this._guideTimer);
    this.els.guideTail.classList.add("guide-hidden");
    this.els.guideFood.classList.add("guide-hidden");
  },

  /* ---------- 猫の状態表示 ---------- */
  _catClasses: [
    "cat-idle", "cat-eating-lean", "cat-eating-munch",
    "cat-eating-finish", "cat-attacking-head", "attacking",
  ],

  setCatState(state) {
    const w = this.els.catWrap;
    this._catClasses.forEach((c) => w.classList.remove(c));
    this._stopMunch();

    if (state === "idle") {
      w.classList.add("cat-idle");
      this._setHead("head_idle");
      this._setTail("tail_idle");
      this._setTailPhase(null);
    } else if (state === "eat-lean") {
      w.classList.add("cat-eating-lean");
      this._setHead("head_eat_01");
      this._setTail("tail_idle");
      this._setTailPhase(null);
    } else if (state === "eat-munch") {
      w.classList.add("cat-eating-munch");
      this._setTail("tail_idle");
      this._setTailPhase(null);
    } else if (state === "eat-finish") {
      w.classList.add("cat-eating-finish");
      this._setHead("head_happy");
      this._setTail("tail_idle");
      this._setTailPhase(null);
    } else if (state === "tail-attack") {
      // 予備動作開始状態。以降のフェーズは playTailAttack が進める
      w.classList.add("cat-attacking-head");
      this._setHead("head_tail_attack");
    }
  },

  /** 旧API互換（表情はhead画像で表現するため実質no-op） */
  setEyes(kind) {
    if (kind === "normal") {
      // idle系へ戻るときはsetCatStateが適切なheadを設定する
    }
  },

  /* ---------- 皿を差し出す / 引っ込める ---------- */
  /** foodItem: foods.js の食品データオブジェクト（image / display.scale,x,y / displayName を使用） */
  serveIn(foodItem, speedScale, onDone) {
    const tray = this.els.tray;
    const food = this.els.food;
    food.className = "food-on-plate";
    food.style.animation = "";
    this._setFoodImage(foodItem);
    tray.classList.remove("retreat");
    tray.style.transitionDuration = (0.32 * speedScale) + "s";
    void tray.offsetWidth;
    tray.classList.add("serving");
    if (foodItem && foodItem.displayName) this.showFoodName(foodItem.displayName);
    const ms = 320 * speedScale + 30;
    setTimeout(() => {
      // お皿のスライドイン完了後（＝実際の表示位置が確定した後）に判定の重なりチェックを行う。
      // start()直後の一回だけだとお皿がまだ画面外にいる状態で計測してしまい判定漏れになるため、
      // 食べ物が出るたびに毎回チェックする。
      this._ensureHitAreaGap();
      onDone();
    }, ms);
  },

  /** 食品画像を差し替え、display.scale/x/yで見た目サイズを正規化する */
  _setFoodImage(foodItem) {
    const img = this.els.foodImg;
    if (!img || !foodItem) return;
    img.src = foodItem.image;
    img.alt = foodItem.displayName || "";
    const d = foodItem.display || { scale: 1, x: 0, y: 0 };
    img.style.transform = `translate(${d.x || 0}px, ${d.y || 0}px) scale(${d.scale || 1})`;
  },

  serveOut(speedScale, onDone) {
    const tray = this.els.tray;
    tray.style.transitionDuration = (0.25 * speedScale) + "s";
    tray.classList.remove("serving");
    tray.classList.add("retreat");
    this.hideFoodName();
    setTimeout(onDone, 250 * speedScale + 30);
  },

  serveReset() {
    const tray = this.els.tray;
    tray.style.transitionDuration = "0s";
    tray.classList.remove("serving");
    tray.classList.add("retreat");
    void tray.offsetWidth;
    this.hideFoodName();
  },

  /* ---------- 出された食べ物の名前表示（画面下側） ---------- */
  showFoodName(name) {
    const tag = this.els.foodNameTag;
    if (!tag) return;
    tag.textContent = name;
    tag.classList.add("visible");
  },
  hideFoodName() {
    const tag = this.els.foodNameTag;
    if (!tag) return;
    tag.classList.remove("visible");
  },

  /* ---------- 食べるアニメーション ----------
   * STEP1 反応(head_eat_01+lean) → STEP2-3 もぐもぐ
   * (eat_01⇔eat_02交互＋頭の上下＋食べ物が減る)
   * → STEP4 満足(head_happy) → idle */
  playEat(speedScale, onDone) {
    const food = this.els.food;
    const s = speedScale;
    this.setCatState("eat-lean");

    const munchStart = 180 * s;
    const munchDur = 850 * s;
    const finishDur = 400 * s;

    const t1 = setTimeout(() => {
      this.setCatState("eat-munch");
      Sound.play("mogumogu");
      // 表情を eat_01 ⇔ eat_02 で交互切替（もぐもぐ）
      let flip = false;
      this._setHead("head_eat_01");
      this._munchTimer = setInterval(() => {
        flip = !flip;
        this._setHead(flip ? "head_eat_02" : "head_eat_01");
      }, Math.max(90, 140 * s));
      // 食べ物が段階的に減る
      const step = munchDur / 4;
      setTimeout(() => food.classList.add("bite-1"), step * 0.8);
      setTimeout(() => { food.classList.remove("bite-1"); food.classList.add("bite-2"); }, step * 1.8);
      setTimeout(() => { food.classList.remove("bite-2"); food.classList.add("bite-3"); }, step * 2.8);
      setTimeout(() => { food.classList.remove("bite-3"); food.classList.add("eaten"); }, step * 3.6);
      this._spawnEatParticles(munchDur);
    }, munchStart);

    const t2 = setTimeout(() => {
      this._stopMunch();
      this.setCatState("eat-finish");
    }, munchStart + munchDur);

    const t3 = setTimeout(() => {
      this.setCatState("idle");
      onDone();
    }, munchStart + munchDur + finishDur);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); this._stopMunch(); };
  },

  _spawnEatParticles(duration) {
    const layer = this.els.eatLayer;
    const words = ["もぐ", "もぐ♪", "ŧ‹\"ŧ‹\"", "もぐ"];
    const count = Math.max(3, Math.round(duration / 180));
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const p = document.createElement("span");
        const isHeart = Math.random() < 0.35;
        p.className = "eat-particle " + (isHeart ? "heart" : "mogu");
        p.textContent = isHeart ? "💕" : words[Math.floor(Math.random() * words.length)];
        p.style.left = (18 + Math.random() * 64) + "%";
        p.style.top = (22 + Math.random() * 30) + "%";
        layer.appendChild(p);
        setTimeout(() => p.remove(), 950);
      }, i * 160);
    }
  },

  /* ---------- 尻尾攻撃アニメーション ----------
   * 参考: reference/05_cat_tail_attack.png
   * idle → ready(裏で右へ振りかぶり)
   * → swing(最前面 tail>head>body で右→左へ薙ぎ払い)
   * → 衝突(バチコーン)＋食品が左へ吹き飛ぶ
   * → return(裏へ戻る) → idle */
  playTailAttack(speedScale, onDone) {
    const s = speedScale;
    const w = this.els.catWrap;
    const food = this.els.food;
    const totalMs = 620 * s;
    const readyEnd = totalMs * 0.30;   // 振りかぶり完了
    const hitMs = totalMs * 0.46;      // 尻尾が食品へ当たる瞬間
    const swingEnd = totalMs * 0.62;   // スイング保持終了 → 復帰開始

    // STEP1: 予備動作（尻尾はまだ裏）
    this.setCatState("tail-attack");
    this._setTail("tail_ready");
    this._setTailPhase("ready");

    // STEP2: 最前面で右→左スイング
    const t1 = setTimeout(() => {
      w.classList.add("attacking");           // tail(5) > head(3) > body(2)
      this._setTail("tail_swing");
      this._setTailPhase("swing");
      const swingMs = Math.max(90, hitMs - readyEnd + 60 * s);
      this.els.tail.style.animationDuration = swingMs + "ms";
    }, readyEnd);

    // STEP3-4: バチコーン！＋食品が左へ吹き飛ぶ
    const t2 = setTimeout(() => {
      this._playImpact();
      Sound.play("attack");
      this.shakeStage();
      food.style.animationDuration = (0.55 * s) + "s";
      food.classList.add("fly-away");
      this._spawnSpeedLines();
    }, hitMs);

    // STEP5: 復帰（尻尾を裏へ戻す）
    const t3 = setTimeout(() => {
      w.classList.remove("attacking");
      this._setTail("tail_return");
      this._setTailPhase("return");
      this.els.tail.style.animationDuration = "";
    }, swingEnd);

    const t4 = setTimeout(() => {
      this.setCatState("idle");
      onDone();
    }, Math.max(totalMs, hitMs + 550 * s) + 40);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
      w.classList.remove("attacking");
      this.els.tail.style.animationDuration = "";
      this._setTailPhase(null);
    };
  },

  _playImpact() {
    const el = this.els.impact;
    el.innerHTML =
      '<div class="impact-star">💥</div>' +
      '<div class="impact-text">バチコーン！</div>';
    el.classList.add("active");
    setTimeout(() => { el.classList.remove("active"); el.innerHTML = ""; }, 550);
  },

  _spawnSpeedLines() {
    const stage = this.els.stage;
    const box = document.createElement("div");
    box.className = "speed-lines active";
    box.style.top = "56%";
    for (let i = 0; i < 4; i++) {
      const line = document.createElement("span");
      line.style.top = (i * 9) + "px";
      line.style.left = (Math.random() * 30) + "%";
      line.style.width = (30 + Math.random() * 40) + "px";
      line.style.animationDelay = (i * 0.03) + "s";
      box.appendChild(line);
    }
    stage.appendChild(box);
    setTimeout(() => box.remove(), 500);
  },

  shakeStage() {
    const stage = this.els.stage;
    stage.classList.remove("shake");
    void stage.offsetWidth;
    stage.classList.add("shake");
    setTimeout(() => stage.classList.remove("shake"), 320);
  },

  pulseStage() {
    const stage = this.els.stage;
    stage.classList.remove("pulse");
    void stage.offsetWidth;
    stage.classList.add("pulse");
    setTimeout(() => stage.classList.remove("pulse"), 480);
  },

  /* ---------- ミス演出 ---------- */
  playMiss(onDone) {
    const wrap = this.els.catWrap;
    wrap.classList.add("miss-shake");
    setTimeout(() => {
      wrap.classList.remove("miss-shake");
      onDone();
    }, 650);
  },

  /* ---------- 判定マーク（◯ / ✕） ---------- */
  showJudge(ok) {
    const mark = document.createElement("div");
    mark.className = "judge-mark " + (ok ? "ok" : "ng");
    mark.textContent = ok ? "◯" : "✕";
    this.els.stage.appendChild(mark);
    setTimeout(() => mark.remove(), 600);
    if (ok) Sound.play("seikai"); // ◯が出た瞬間に正解音を再生
  },

  /* ---------- スコア加算ポップ ----------
   * 正解時の ◯ マーク（judge-mark、top:34%・114px）と重なって読みにくく
   * ならないよう、◯ の下（見た目の下端より下）に表示する。 */
  showScorePop(points) {
    const pop = document.createElement("div");
    pop.className = "score-pop";
    pop.textContent = "+" + points;
    pop.style.left = (38 + Math.random() * 20) + "%";
    pop.style.top = "54%";
    this.els.stage.appendChild(pop);
    setTimeout(() => pop.remove(), 850);
  },

  /* ---------- COMBO演出 ----------
   * tier: 0(通常) 1(5+) 2(10+) 3(20+) 4(30+) */
  comboTierFor(combo) {
    if (combo >= 30) return 4;
    if (combo >= 20) return 3;
    if (combo >= 10) return 2;
    if (combo >= 5) return 1;
    return 0;
  },

  updateCombo(combo) {
    // combo=0（ゲーム開始時・リセット時）は次のマイルストーンを必ず出せるようにする
    if (combo === 0) this._lastMilestoneCombo = 0;
    const box = this.els.comboBox;
    const val = this.els.comboValue;
    val.textContent = "×" + combo;
    ["tier-1", "tier-2", "tier-3", "tier-4"].forEach((c) => box.classList.remove(c));
    const tier = this.comboTierFor(combo);
    if (tier > 0) box.classList.add("tier-" + tier);
    val.classList.remove("pop", "drop");
    void val.offsetWidth;
    val.classList.add("pop");
  },

  comboLost(prevCombo) {
    const box = this.els.comboBox;
    const val = this.els.comboValue;
    ["tier-1", "tier-2", "tier-3", "tier-4"].forEach((c) => box.classList.remove(c));
    val.textContent = "×0";
    val.classList.remove("pop", "drop");
    void val.offsetWidth;
    if (prevCombo >= 3) val.classList.add("drop");
    this._lastMilestoneCombo = 0; // COMBOが切れたら次の周でも同じ値の演出を再度出せるようにする
  },

  /** COMBOマイルストーンの段階を返す（演出対象外は0）。
   * 優先順位: 100の倍数 > 50の倍数 > 10の倍数（すべてcombo%10===0が前提）。 */
  _comboMilestoneLevel(combo) {
    if (combo <= 0 || combo % 10 !== 0) return 0;
    if (combo % 100 === 0) return 3;
    if (combo % 50 === 0) return 2;
    return 1;
  },

  /** COMBOマイルストーン演出（10/20/30…10刻み、3段階）。
   * ゲーム進行は止めず、pointer-events:noneの#combo-banner-layerへの
   * オーバーレイ表示のみで完結させる（食品・尻尾タップは常に有効のまま）。 */
  showComboMilestone(combo) {
    const level = this._comboMilestoneLevel(combo);
    if (level === 0) return;
    if (this._lastMilestoneCombo === combo) return; // 同じCOMBO値での二重発火防止
    this._lastMilestoneCombo = combo;

    const layer = this.els.comboLayer;
    layer.innerHTML = "";
    const b = document.createElement("div");
    b.className = "combo-milestone lvl-" + level;

    const main = document.createElement("div");
    main.className = "combo-milestone-main";
    main.textContent = combo + " COMBO" + (level >= 3 ? "!!" : "!");
    b.appendChild(main);

    const subText = COMBO_MILESTONE_MESSAGES[combo] || (level >= 3 ? COMBO_LEVEL3_FALLBACK_MESSAGE : "");
    if (subText) {
      const sub = document.createElement("div");
      sub.className = "combo-milestone-sub";
      sub.textContent = subText;
      b.appendChild(sub);
    }

    layer.appendChild(b);
    // CSS側のアニメーション時間（.combo-milestone.lvl-*）と揃える。
    // お褒め言葉をしっかり読める余韻を優先し、長めに表示してからフェードアウトする。
    const durationMs = level >= 3 ? 2600 : level >= 2 ? 2300 : 2000;
    setTimeout(() => b.remove(), durationMs);

    this._spawnMilestoneParticles(level);
    if (level >= 2) this.pulseStage(); // LEVEL2以上のみ軽い画面フラッシュ
    this._comboReactionBounce();

    // 将来のSE追加用フック（combo_10.mp3 / combo_50.mp3 / combo_100.mp3）。
    // 未配置の間はSound.play側で自動的に無音スキップされる（既存SEの流用はしない）。
    const sfxName = level >= 3 ? "combo_100" : level >= 2 ? "combo_50" : "combo_10";
    if (typeof Sound !== "undefined" && Sound.play) Sound.play(sfxName);
  },

  _spawnMilestoneParticles(level) {
    const stage = this.els.stage;
    const icons = level >= 3 ? ["✨", "🐾", "💖", "⭐"] : level >= 2 ? ["✨", "💖", "⭐"] : ["✨", "⭐"];
    const count = level >= 3 ? 9 : level >= 2 ? 6 : 3;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const sp = document.createElement("span");
        sp.className = "sparkle";
        sp.textContent = icons[Math.floor(Math.random() * icons.length)];
        sp.style.left = (10 + Math.random() * 80) + "%";
        sp.style.top = (2 + Math.random() * 22) + "%";
        stage.appendChild(sp);
        setTimeout(() => sp.remove(), 850);
      }, i * 60);
    }
  },

  /** COMBO到達時の猫の小さなリアクション。食事・尻尾攻撃アニメーション中は
   * 邪魔しないよう、猫が完全にidle状態のときだけ実行する（安全に重ねられる場合のみ）。 */
  _comboReactionBounce() {
    const w = this.els.catWrap;
    if (!w.classList.contains("cat-idle")) return;
    w.classList.remove("combo-bounce");
    void w.offsetWidth;
    w.classList.add("combo-bounce");
    setTimeout(() => w.classList.remove("combo-bounce"), 420);
  },
};
