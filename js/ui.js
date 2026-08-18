/* =========================================================
 * ぷろ猫けんてい - UI制御
 * =========================================================
 * 画面遷移・HUD更新・図鑑・結果画面・きろく表示。
 * ゲームロジック(game.js)から呼ばれる。
 * ========================================================= */

const UI = {
  screens: {},

  init() {
    this.screens = {
      title: document.getElementById("screen-title"),
      game: document.getElementById("screen-game"),
      result: document.getElementById("screen-result"),
      zukan: document.getElementById("screen-zukan"),
    };
    this.els = {
      score: document.getElementById("hud-score"),
      life: document.getElementById("hud-life"),
      time: document.getElementById("hud-time"),
      mission: document.getElementById("mission-label"),
      titleBestRank: document.getElementById("title-best-rank"),
      pauseOverlay: document.getElementById("overlay-pause"),
      rankingOverlay: document.getElementById("overlay-ranking"),
      foodDetailOverlay: document.getElementById("overlay-food-detail"),
    };
    this._zukanReturnTo = "title";
  },

  show(name) {
    Object.values(this.screens).forEach((s) => s.classList.remove("active"));
    this.screens[name].classList.add("active");
  },

  /* ---------- HUD ---------- */
  setScore(score) {
    this.els.score.textContent = score.toLocaleString();
  },

  setLife(life, max = 3) {
    let html = "";
    for (let i = 0; i < max; i++) {
      html += `<span class="heart${i < life ? "" : " lost"}">${i < life ? "❤" : "🖤"}</span>`;
    }
    this.els.life.innerHTML = html;
  },

  setTime(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(Math.floor(seconds % 60)).padStart(2, "0");
    this.els.time.textContent = `${m}:${s}`;
  },

  setMission(text) {
    this.els.mission.textContent = text;
  },

  setPause(active) {
    this.els.pauseOverlay.classList.toggle("active", active);
  },

  /* ---------- タイトル：最高段位表示 ---------- */
  /** ミュートボタン・ボリュームスライダー(HUD・タイトル・ポーズ)の見た目をSoundの状態へ同期する */
  refreshMuteButtons() {
    const muted = Sound.muted;
    const percent = Sound.getVolumePercent();
    const icon = muted ? "🔇" : percent < 40 ? "🔉" : "🔊";

    const hudBtn = document.getElementById("btn-mute");
    if (hudBtn) {
      hudBtn.textContent = icon;
      hudBtn.classList.toggle("is-muted", muted);
    }
    const settingsBtn = document.getElementById("btn-mute-settings");
    const settingsIcon = document.getElementById("mute-settings-icon");
    const settingsLabel = document.getElementById("mute-settings-label");
    if (settingsBtn) settingsBtn.classList.toggle("is-muted", muted);
    if (settingsIcon) settingsIcon.textContent = icon;
    if (settingsLabel) settingsLabel.textContent = muted ? "音OFF" : "音ON";

    const pauseBtn = document.getElementById("btn-mute-pause");
    const pauseIcon = document.getElementById("mute-pause-icon");
    if (pauseBtn) pauseBtn.classList.toggle("is-muted", muted);
    if (pauseIcon) pauseIcon.textContent = icon;

    // スライダー・パーセント表示（ドラッグ中の自要素は更新しない）
    const sliderVal = muted ? 0 : percent;
    [
      ["volume-slider-settings", "volume-percent-settings"],
      ["volume-slider-pause", "volume-percent-pause"],
    ].forEach(([sliderId, pctId]) => {
      const slider = document.getElementById(sliderId);
      const pct = document.getElementById(pctId);
      if (slider && document.activeElement !== slider) slider.value = sliderVal;
      if (pct) pct.textContent = sliderVal + "%";
    });
  },

  /** DIFFICULTY_MODESのenabledフラグに応じて、難易度ボタンの表示・押下可否を同期する。
   * 中級・上級はデータが揃うまでenabled:falseとし、「🔒 準備中」表示にしてタップしても
   * ゲームが始まらないようにする（Game._bindInputsの側でもenabledチェックあり）。 */
  refreshDifficultyButtons() {
    document.querySelectorAll(".btn-diff").forEach((btn) => {
      const mode = DIFFICULTY_MODES[btn.dataset.mode];
      if (!mode) return;
      const desc = btn.querySelector(".diff-desc");
      btn.classList.toggle("btn-diff-disabled", !mode.enabled);
      btn.setAttribute("aria-disabled", String(!mode.enabled));
      if (desc) desc.textContent = mode.enabled ? "▶ プレイ" : "🔒 準備中";
    });
  },

  refreshTitleBest() {
    const s = Storage.load();
    const box = this.els.titleBestRank;
    if (s.bestRankIndex < 0) {
      box.innerHTML = `<div>まだ認定されていません</div><div class="brb-progress">プレイして「ぷろ猫」を目指そう！</div>`;
      return;
    }
    const rank = RANKS[s.bestRankIndex];
    let html = `<div>あなたの最高段位</div><div class="brb-rank">${rank.label}</div><div class="brb-progress">${rank.title}</div>`;
    // 直近の認定結果から次ランク進捗を表示
    const last = s.history[0];
    if (last && s.bestRankIndex < RANKS.length - 1 && typeof last.composite === "number") {
      const prog = rankProgress(last.composite, last.rankIndex);
      if (prog.next) {
        html += `<div class="brb-progress">${prog.next.label}まで あと ${Math.round((1 - prog.progress) * 100)}%</div>` +
          `<div class="progress-bar"><div style="width:${Math.round(prog.progress * 100)}%"></div></div>`;
      }
    }
    box.innerHTML = html;
  },

  /* ---------- 検定結果画面 ---------- */
  showResult(result) {
    // result: { rankEval, stats, saveResult, wrongFoods, mode }
    const { rankEval, stats, saveResult, wrongFoods } = result;
    const rank = rankEval.rank;

    const certEl = document.getElementById("rank-cert");
    const rankEl = document.getElementById("result-rank");
    rankEl.textContent = rank.label;
    rankEl.classList.toggle("dan", rank.grade === "dan");
    document.getElementById("result-rank-title").textContent = rank.title;
    certEl.classList.remove("appear");
    void certEl.offsetWidth;
    certEl.classList.add("appear");

    document.getElementById("result-accuracy").textContent =
      stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) + "%" : "-";
    document.getElementById("result-combo").textContent = stats.maxCombo;
    document.getElementById("result-avoid").textContent =
      `${stats.dangerAvoided} / ${stats.dangerTotal}`;
    document.getElementById("result-score").textContent = stats.score.toLocaleString();

    // 昇級・昇段バナー
    this._renderRankupBanner(rankEval, saveResult);

    // 次の階級までの進捗
    const nextBox = document.getElementById("result-next-rank");
    const prog = rankProgress(rankEval.compositeScore, rankEval.rankIndex);
    if (prog.next) {
      nextBox.innerHTML =
        `現在：<b>${rank.label}</b>　${prog.next.label}まで あと ${Math.round((1 - prog.progress) * 100)}%` +
        `<div class="progress-bar"><div style="width:${Math.round(prog.progress * 100)}%"></div></div>`;
    } else {
      nextBox.innerHTML = `<b>八段</b>：最高段位です！ぷろ猫マスター！🐾`;
    }

    // 間違えた食品リスト
    this._renderWrongFoods(wrongFoods);

    this.show("result");
  },

  _renderRankupBanner(rankEval, saveResult) {
    const banner = document.getElementById("rankup-banner");
    banner.hidden = true;
    banner.className = "rankup-banner";
    if (!saveResult.newBestRank) return;

    const newRank = rankEval.rank;
    const prevIdx = saveResult.prevBestRankIndex;
    const prevRank = prevIdx >= 0 ? RANKS[prevIdx] : null;
    const isDanPromotion = prevRank && prevRank.grade === "kyu" && newRank.grade === "dan";
    const isDan8 = newRank.id === "dan8";

    let head, flow;
    if (isDan8) {
      banner.classList.add("dan8");
      head = "🎊 ぷろ猫 八段 🎊";
      flow = prevRank
        ? `${prevRank.label}<span class="ru-arrow">→</span>八段`
        : "八段 認定";
      banner.innerHTML =
        `<div class="ru-head">${head}</div>` +
        `<div class="ru-flow">${flow}</div>` +
        `<div class="ru-master">最高段位認定　ぷろ猫マスター</div>` +
        `<div>🐾 ✨ 🐾 ✨ 🐾</div>`;
    } else if (isDanPromotion || (prevRank && prevRank.grade === "dan")) {
      // 級→段は特別な「昇段」/ 段位間も「昇段」
      banner.classList.add("dan-up");
      head = "🎉 昇段！ 🎉";
      flow = `${prevRank.label}<span class="ru-arrow">→</span>${newRank.label}`;
      banner.innerHTML =
        `<div class="ru-head">${head}</div>` +
        `<div class="ru-flow">${flow}</div>` +
        (isDanPromotion ? `<div class="ru-master">「級」から「段」へ！ぷろ猫への入口！🐾✨</div>` : `<div>🐾 ✨</div>`);
    } else {
      head = "昇級！";
      flow = prevRank
        ? `${prevRank.label}<span class="ru-arrow">→</span>${newRank.label}`
        : `${newRank.label} 認定！`;
      banner.innerHTML =
        `<div class="ru-head">${head}</div>` +
        `<div class="ru-flow">${flow}</div>` +
        `<div>🐾</div>`;
    }
    banner.hidden = false;
  },

  _renderWrongFoods(wrongFoods) {
    const list = document.getElementById("wrong-foods-list");
    list.innerHTML = "";
    if (!wrongFoods.length) {
      list.innerHTML = `<div class="no-wrong">ノーミス！すばらしい判断力です 🐾✨</div>`;
      return;
    }
    wrongFoods.forEach((wf) => {
      const food = wf.food;
      const card = document.createElement("div");
      // risk別に見た目を分ける： safe(緑)/caution(黄)/danger(赤)。dangerとcautionを同一視しない
      card.className = "wrong-food-card was-" + food.risk;
      const verdict = food.resultBadge || (food.risk === "safe" ? "食べてOKだった" : "注意が必要");
      const wasSafe = food.risk === "safe";
      const why = wf.kind === "timeout"
        ? "時間内に判断できませんでした。次はよく見て判断してみましょう。"
        : wasSafe
          ? "食べてもよい物を弾いてしまいました。"
          : (food.summary || "");
      const missKind = wf.kind === "timeout"
        ? "（時間切れ）"
        : wasSafe ? "（尻尾で弾いてしまった）" : "（食べさせてしまった）";
      card.innerHTML =
        `<div class="wf-head"><img class="wf-emoji" src="${food.image}" alt="${food.displayName}">` +
        `<span>${food.displayName} <small>${missKind}</small></span>` +
        `<span class="wf-verdict">${verdict}</span></div>` +
        `<div class="wf-why">${why}</div>` +
        (!wasSafe && food.emergencyAdvice ? `<div class="wf-why">🏥 ${food.emergencyAdvice}</div>` : "") +
        `<div class="wf-link">▶ 図鑑でくわしく見る</div>`;
      card.addEventListener("click", () => {
        this.openFoodDetail(food.id);
      });
      list.appendChild(card);
    });
  },

  /* ---------- 図鑑 ---------- */
  openZukan(returnTo) {
    this._zukanReturnTo = returnTo || "title";
    const grid = document.getElementById("zukan-grid");
    grid.innerHTML = "";
    FOODS.forEach((food) => {
      const discovered = Storage.isDiscovered(food.id);
      const cell = document.createElement("button");
      cell.className = "zukan-cell" + (discovered ? "" : " unknown");
      if (discovered) {
        const safetyLabel = food.risk === "safe" ? "OK" : food.risk === "caution" ? "注意" : "危険";
        cell.innerHTML =
          `<img class="zc-emoji" src="${food.image}" alt="${food.displayName}">` +
          `<span class="zc-name">${food.displayName}</span>` +
          `<span class="zc-safety ${food.risk}">${safetyLabel}</span>`;
        cell.addEventListener("click", () => this.openFoodDetail(food.id));
      } else {
        cell.innerHTML =
          `<span class="zc-emoji zc-emoji-unknown">❓</span>` +
          `<span class="zc-name">？？？</span>`;
      }
      grid.appendChild(cell);
    });
    this.show("zukan");
  },

  zukanBack() {
    this.show(this._zukanReturnTo);
  },

  openFoodDetail(foodId) {
    const food = FOODS.find((f) => f.id === foodId);
    if (!food) return;
    const panel = document.getElementById("food-detail-panel");
    const safetyLabel = food.risk === "safe" ? "食べてOK" : food.risk === "caution" ? "注意が必要" : "猫には与えない";
    const actionLabel = food.correctAction === "eat" ? "🍚 食べ物をタップ" : "⚡ 尻尾で弾く";
    const feedLabel = FEEDING_RECOMMENDATION_LABELS[food.feedingRecommendation] || "";
    const categoryChips = (food.riskCategories || [])
      .map((c) => `<span class="fd-chip">${RISK_CATEGORY_LABELS[c] || c}</span>`).join("");

    let html =
      `<div class="fd-head">` +
      `<img class="fd-emoji" src="${food.image}" alt="${food.displayName}">` +
      `<div><div class="fd-name">${food.displayName}</div>` +
      `<div class="fd-category">正解操作：${actionLabel}</div>` +
      `<span class="fd-verdict ${food.risk}">${safetyLabel}</span></div></div>` +
      `<p class="placeholder-banner">⚠ 本データは公的資料・獣医師監修記事等をもとに作成していますが、正式な獣医師監修を受けたものではありません</p>`;

    if (categoryChips) html += `<div class="fd-chips">${categoryChips}</div>`;
    if (feedLabel) html += `<div class="fd-section"><h4>与え方の目安</h4>${feedLabel}</div>`;

    html += `<div class="fd-section"><h4>説明</h4>${food.summary || "－"}</div>`;
    if (food.detail) {
      html += `<div class="fd-section"><h4>くわしい解説</h4>${food.detail}</div>`;
    }
    if (food.mainRisks && food.mainRisks.length) {
      html += `<div class="fd-section"><h4>起こりうる影響</h4>${food.mainRisks.join("／")}</div>`;
    }
    if (food.careTips && food.careTips.length) {
      html += `<div class="fd-section"><h4>おうちでの予防</h4>・${food.careTips.join("<br>・")}</div>`;
    }
    if (food.emergencyAdvice) {
      html += `<div class="fd-section"><h4>食べてしまったら</h4>${food.emergencyAdvice}</div>`;
    }
    if (food.sources && food.sources.length) {
      const srcList = food.sources.map((s) => s.organization + (s.title ? "『" + s.title + "』" : "")).join("<br>");
      html += `<div class="fd-source">情報源：<br>${srcList}</div>`;
    }
    html += `<button class="btn btn-sub" id="btn-food-detail-close">とじる</button>`;
    panel.innerHTML = html;
    document.getElementById("btn-food-detail-close").addEventListener("click", () => {
      this.els.foodDetailOverlay.classList.remove("active");
    });
    this.els.foodDetailOverlay.classList.add("active");
  },

  /* ---------- きろく（ローカルランキング） ---------- */
  openRanking() {
    const s = Storage.load();
    const body = document.getElementById("ranking-body");
    const rank = s.bestRankIndex >= 0 ? RANKS[s.bestRankIndex] : null;
    body.innerHTML =
      `🏆 ハイスコア：<b>${s.highScore.toLocaleString()}</b><br>` +
      `🔥 最高COMBO：<b>${s.bestCombo}</b><br>` +
      `🎯 最高正答率：<b>${Math.round(s.bestAccuracy * 100)}%</b><br>` +
      `📜 最高段位：<b>${rank ? rank.label : "未認定"}</b>` +
      (rank ? `<br><small>${rank.title}</small>` : "");
    this.els.rankingOverlay.classList.add("active");
  },
};
