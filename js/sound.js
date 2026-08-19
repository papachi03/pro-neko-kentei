/* =========================================================
 * ぷろ猫けんてい - 効果音・BGM
 * =========================================================
 * ブラウザ・端末によっては同じvolume値でも体感音量が大きく異なるため、
 * コード側の固定音量に加えて、プレイヤー自身がミュート/解除できる
 * UIコントロールを必ず用意する。設定はlocalStorageに保存し次回も維持する。
 * ブラウザの自動再生制限のため、BGMは最初のユーザー操作で開始する。
 *
 * 音量はBGMとSE（効果音）を別々のスライダーで調整できるよう、
 * bgmVolume / seVolume の2系統を持つ（全体ミュートは共通で1つ）。
 * ========================================================= */

const Sound = {
  bgm: null,
  sfx: {},
  unlocked: false,
  muted: false,
  bgmVolume: 1.0, // 0.0〜1.0。BGMスライダーの係数
  seVolume: 1.0,  // 0.0〜1.0。効果音スライダーの係数

  // ベース音量（各音の「基準となる大きさ」。実際の再生音量は base × (bgmVolume|seVolume)）
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
    this.bgmVolume = this._loadVolumePref("soundVolumeBgm");
    this.seVolume = this._loadVolumePref("soundVolumeSe");

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

  /** BGM・SFXそれぞれの.volumeへ bgmVolume / seVolume を反映する */
  _applyVolumes() {
    if (this.bgm) this.bgm.volume = this.BASE_VOLUME.bgm * this.bgmVolume;
    Object.keys(this.sfx).forEach((name) => {
      this.sfx[name].volume = this.BASE_VOLUME[name] * this.seVolume;
    });
  },

  /** BGMスライダーから呼ぶ。percent: 0〜100 */
  setBgmVolume(percent) {
    this.bgmVolume = Math.max(0, Math.min(100, percent)) / 100;
    this._applyVolumes();
    this._saveVolumePref("soundVolumeBgm", this.bgmVolume);
    this._syncMuteWithVolumes();
  },
  /** 効果音スライダーから呼ぶ。percent: 0〜100 */
  setSeVolume(percent) {
    this.seVolume = Math.max(0, Math.min(100, percent)) / 100;
    this._applyVolumes();
    this._saveVolumePref("soundVolumeSe", this.seVolume);
    this._syncMuteWithVolumes();
  },
  getBgmVolumePercent() { return Math.round(this.bgmVolume * 100); },
  getSeVolumePercent() { return Math.round(this.seVolume * 100); },

  /** BGM・SEの両方が0%になったら自動でミュートON、どちらかが1%以上に
   * 戻ったらミュート解除する（単一スライダー時代の使い勝手を踏襲） */
  _syncMuteWithVolumes() {
    const bothZero = this.bgmVolume === 0 && this.seVolume === 0;
    if (bothZero && !this.muted) this.setMuted(true, { skipVolumeSync: true });
    else if (!bothZero && this.muted) this.setMuted(false, { skipVolumeSync: true });
  },

  _loadVolumePref(key) {
    try {
      const s = Storage.load();
      const v = s.settings && s.settings[key];
      if (typeof v === "number" && v >= 0 && v <= 1) return v;
      // 旧バージョン（BGM/SE共通の単一音量）からの移行
      const legacy = s.settings && s.settings.soundVolume;
      return (typeof legacy === "number" && legacy >= 0 && legacy <= 1) ? legacy : 1.0;
    } catch (e) { return 1.0; }
  },
  _saveVolumePref(key, value) {
    try {
      const s = Storage.load();
      s.settings = s.settings || {};
      s.settings[key] = value;
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
    // ミュート解除時、両方の音量が0のままだと無音に戻ってしまうため既定値へ戻す
    if (!muted && this.bgmVolume === 0 && this.seVolume === 0 && !(opts && opts.skipVolumeSync)) {
      this.bgmVolume = 1.0;
      this.seVolume = 1.0;
      this._applyVolumes();
      this._saveVolumePref("soundVolumeBgm", this.bgmVolume);
      this._saveVolumePref("soundVolumeSe", this.seVolume);
    }
    if (!this.bgm) return;
    if (muted) {
      this.bgm.pause();
    } else if (this.unlocked) {
      this.bgm.play().catch(() => {});
    }
  },
};
