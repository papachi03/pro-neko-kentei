/* =========================================================
 * ぷろ猫けんてい - 効果音・BGM
 * =========================================================
 * ブラウザ・端末によっては同じvolume値でも体感音量が大きく異なるため、
 * コード側の固定音量に加えて、プレイヤー自身がミュート/解除できる
 * UIコントロールを必ず用意する。設定はlocalStorageに保存し次回も維持する。
 * ブラウザの自動再生制限のため、BGMは最初のユーザー操作で開始する。
 * ========================================================= */

const Sound = {
  bgm: null,
  sfx: {},
  unlocked: false,
  muted: false,
  masterVolume: 1.0, // 0.0〜1.0。ボリュームスライダーでユーザーが調整する係数

  // ベース音量（各音の「基準となる大きさ」。実際の再生音量は base × masterVolume）
  BASE_VOLUME: {
    bgm: 0.10,
    attack: 0.5,
    mogumogu: 0.3,
    hazure: 0.3,
    seikai: 0.4,
    combo01: 0.4, combo02: 0.4, combo03: 0.4, combo04: 0.4, combo05: 0.4,
    combo06: 0.4, combo07: 0.4, combo08: 0.4, combo09: 0.4, combo10: 0.45,
  },

  init() {
    this.muted = this._loadMutedPref();
    this.masterVolume = this._loadVolumePref();

    this.bgm = new Audio("assets/sounds/BGM.mp3");
    this.bgm.loop = true;

    this.sfx.attack = this._makeSfx("assets/sounds/attack.mp3", this.BASE_VOLUME.attack);
    this.sfx.mogumogu = this._makeSfx("assets/sounds/mogumogu.wav", this.BASE_VOLUME.mogumogu);
    this.sfx.hazure = this._makeSfx("assets/sounds/hazure.mp3", this.BASE_VOLUME.hazure);
    this.sfx.seikai = this._makeSfx("assets/sounds/seikai.mp3", this.BASE_VOLUME.seikai);
    // COMBO節目演出音：combo01〜combo10。10コンボごとに進み、100コンボ(combo10)で
    // 1周し、110コンボからまたcombo01に戻る（100刻みで演出が「戻ってくる」ことで
    // 100コンボ到達の達成感を出す仕組み）
    for (let i = 1; i <= 10; i++) {
      const key = "combo" + String(i).padStart(2, "0");
      this.sfx[key] = this._makeSfx("assets/sounds/" + key + ".mp3", this.BASE_VOLUME[key]);
    }
    this._applyVolumes();
  },

  /** 全ての音量（BGM・SFXの.volume）へ masterVolume を反映する */
  _applyVolumes() {
    if (this.bgm) this.bgm.volume = this.BASE_VOLUME.bgm * this.masterVolume;
    Object.keys(this.sfx).forEach((name) => {
      this.sfx[name].volume = this.BASE_VOLUME[name] * this.masterVolume;
    });
  },

  /** スライダーから呼ぶ。value: 0〜100 */
  setVolume(percent) {
    this.masterVolume = Math.max(0, Math.min(100, percent)) / 100;
    this._applyVolumes();
    this._saveVolumePref();
    // 0%にしたら自動でミュート、1%以上に戻したらミュート解除
    if (this.masterVolume === 0 && !this.muted) this.setMuted(true, { skipVolumeSync: true });
    else if (this.masterVolume > 0 && this.muted) this.setMuted(false, { skipVolumeSync: true });
  },
  getVolumePercent() { return Math.round(this.masterVolume * 100); },

  _loadVolumePref() {
    try {
      const s = Storage.load();
      const v = s.settings && s.settings.soundVolume;
      return (typeof v === "number" && v >= 0 && v <= 1) ? v : 1.0;
    } catch (e) { return 1.0; }
  },
  _saveVolumePref() {
    try {
      const s = Storage.load();
      s.settings = s.settings || {};
      s.settings.soundVolume = this.masterVolume;
      Storage.save();
    } catch (e) { /* 保存できなくても続行 */ }
  },

  _makeSfx(src, baseVolume) {
    const el = new Audio(src);
    el.preload = "auto";
    return { el, volume: baseVolume }; // volumeプロパティは _applyVolumes が都度書き換える実効音量
  },

  _loadMutedPref() {
    try {
      const s = Storage.load();
      return !!(s.settings && s.settings.soundMuted);
    } catch (e) { return false; }
  },
  _saveMutedPref() {
    try {
      const s = Storage.load();
      s.settings = s.settings || {};
      s.settings.soundMuted = this.muted;
      Storage.save();
    } catch (e) { /* 保存できなくても続行 */ }
  },

  /** 効果音を再生。連続発火に備え、再生中でも先頭から鳴らし直す */
  play(name) {
    if (this.muted) return;
    const s = this.sfx[name];
    if (!s) return;
    try {
      s.el.currentTime = 0;
      s.el.volume = s.volume;
      s.el.play().catch(() => {});
    } catch (e) { /* 再生失敗は無視（ゲーム進行を止めない） */ }
  },

  /** COMBOが10の倍数（10,20,30…100,110,120…）に達した節目で呼ぶ。
   * combo01〜combo10を10刻みで順に再生し、100（combo10）で1周、
   * 110からはまたcombo01に戻る。 */
  playComboMilestone(combo) {
    if (combo < 10 || combo % 10 !== 0) return;
    const idx = (((combo / 10) - 1) % 10) + 1;
    this.play("combo" + String(idx).padStart(2, "0"));
  },

  /** 最初のユーザー操作で呼ぶ。以後は何度呼んでも安全（二重再生しない） */
  startBgm() {
    if (this.unlocked || !this.bgm) return;
    this.unlocked = true;
    if (this.muted) return; // ミュート中は再生自体を開始しない
    this.bgm.play().catch(() => {
      // 自動再生がブロックされた場合は次の操作で再試行
      this.unlocked = false;
    });
  },

  pauseBgm() { if (this.bgm) this.bgm.pause(); },
  resumeBgm() { if (this.unlocked && !this.muted && this.bgm) this.bgm.play().catch(() => {}); },

  /** ミュートON/OFFを切り替える。ONにした瞬間BGMも即座に止める */
  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  },
  setMuted(muted, opts) {
    this.muted = muted;
    this._saveMutedPref();
    // ミュート解除時、音量が0のままだと無音に戻ってしまうため既定値へ戻す
    if (!muted && this.masterVolume === 0 && !(opts && opts.skipVolumeSync)) {
      this.masterVolume = 1.0;
      this._applyVolumes();
      this._saveVolumePref();
    }
    if (!this.bgm) return;
    if (muted) {
      this.bgm.pause();
    } else if (this.unlocked) {
      this.bgm.play().catch(() => {});
    }
  },
};
