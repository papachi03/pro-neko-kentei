/* =========================================================
 * ぷろ猫けんてい - 食品データ（初級編 正式版）
 * =========================================================
 * 初級編は docs/foods-beginner-design.md の設計・調査を経て正式確定した
 * 13食品に、拡張候補6食品（猫用ウェットフード／加熱卵／加熱白身魚／
 * 生肉／長ねぎ／ココア）を正式採用し、計19食品構成としたもの
 * （環境省ガイドライン・ASPCA・Cornell Feline Health Center・
 * Merck Veterinary Manual・JAVMA・日本の獣医師監修記事等を根拠資料として使用）。
 *
 * 画像は正式イラスト（assets/foods/）を使用。ゲームロジックはこの
 * データ構造にのみ依存しており、本ファイルを差し替えるだけで
 * 情報を更新できる。
 *
 * risk（医学的な安全性の3分類）と feedingRecommendation（推奨頻度）
 * は独立した軸。「safe＝好きなだけ与えてよい」という誤解を防ぐため
 * 意図的に分離している。
 * ========================================================= */

const FOOD_DATA_STATUS = "verified-beginner"; // 初級19食品は正式確定済み

// risk: "safe" | "caution" | "danger"（医学的安全性）
// feedingRecommendation: "daily" | "occasional" | "avoid" | "never"（推奨頻度。riskとは別軸）
// correctAction: "eat" | "flick"（ゲーム操作としての正解）
// riskCategories: 危険・注意理由のカテゴリ（複数可）
//   toxin                … 特定成分による中毒
//   nutrient_deficiency  … 栄養素の破壊・吸収阻害（毒ではない）
//   digestive_upset      … 中毒ではなく消化器症状
//   human_food_seasoning … 人間向けの味付け・塩分（添加物=毒という意味ではない）
//   pathogen_risk        … 生食による細菌・寄生虫汚染のリスク（毒ではなく衛生上の注意）
// display: { scale, x, y } … 食品ごとの画像占有率の違いを吸収し、皿の上での見た目サイズを揃える補正値

const FOODS = [
  /* ---------------- SAFE 8種 ---------------- */
  {
    id: "cat_food",
    displayName: "猫用総合栄養食",
    image: "assets/foods/food_cat_food.png",
    display: { scale: 0.98, x: 0, y: 0 },
    level: "beginner",
    difficultyLevel: 1,
    risk: "safe",
    riskCategories: [],
    feedingRecommendation: "daily",
    correctAction: "eat",
    resultBadge: "食べてOK",
    shortMessage: ["正解！", "猫用総合栄養食は毎日の主食だよ。", "栄養バランスもばっちり。"],
    summary: "猫のために栄養バランスが調整された総合栄養食です。基本の食事として毎日与えられます。",
    detail: "総合栄養食は、猫に必要な栄養素をバランスよく含むよう調整された唯一の"
      + "「主食」候補です。他のsafe食品（おやつ・ミルク等）は補助的な位置づけで、"
      + "主食として毎日与えるのはこの総合栄養食が基本になります。",
    mainRisks: [],
    careTips: ["年齢や体調に合ったフードを選ぶ", "パッケージの給与量を目安にする"],
    emergencyAdvice: "",
    sources: [
      { organization: "環境省", title: "飼い主のためのペットフード・ガイドライン ～犬・猫の健康を守るために～", url: "https://www.env.go.jp/nature/dobutsu/aigo/2_data/pamph/petfood_guide_1808.html", checkedAt: "2026-08-19" },
    ],
  },
  {
    id: "chicken_cooked",
    displayName: "加熱した鶏ささみ（味付けなし・骨なし）",
    image: "assets/foods/food_chicken_cooked.png",
    display: { scale: 0.92, x: 0, y: 0 },
    level: "beginner",
    difficultyLevel: 3,
    risk: "safe",
    riskCategories: [],
    feedingRecommendation: "occasional",
    correctAction: "eat",
    resultBadge: "食べてOK",
    shortMessage: ["正解！", "加熱・味付けなし・骨なしなら食べられるよ。", "でも主食ではなく補助的なごはん。"],
    summary: "味付けをせず十分に加熱し、骨を取り除いたささみは補助的に与えられます。",
    detail: "「肉だから安全」ではなく、加熱済み・味付けなし・骨なしという条件がそろって"
      + "はじめて安全に近づきます。栄養バランスは主食ほど調整されていないため、"
      + "トッピングやごほうび程度の補助的な与え方が適切です。",
    mainRisks: [],
    careTips: ["必ず十分に加熱する", "味付け・骨に注意する", "主食の代わりにはしない"],
    emergencyAdvice: "",
    sources: [
      { organization: "獣医師監修記事（複数）", title: "猫に鶏肉を与える際の条件に関する解説", url: "", checkedAt: "2026-08-19" },
    ],
  },
  {
    id: "salmon_cooked",
    displayName: "加熱した鮭（味付けなし・骨なし）",
    image: "assets/foods/food_salmon_cooked.png",
    display: { scale: 0.92, x: 0, y: 0 },
    level: "beginner",
    difficultyLevel: 3,
    risk: "safe",
    riskCategories: [],
    feedingRecommendation: "occasional",
    correctAction: "eat",
    resultBadge: "食べてOK",
    shortMessage: ["正解！", "加熱・味付けなし・骨なしの鮭は食べられるよ。", "塩鮭とは別物として区別してね。"],
    summary: "味付けをせず十分に加熱し、骨を取り除いた鮭は補助的に与えられます。",
    detail: "魚も条件付きで安全になる代表例です。加熱済み・味付けなし・骨なしという"
      + "条件が必須で、人間用の塩鮭など味付きの加工品とは別物として扱う必要があります。",
    mainRisks: [],
    careTips: ["必ず十分に加熱する", "骨を丁寧に取り除く", "塩鮭・味付き商品と混同しない"],
    emergencyAdvice: "",
    sources: [
      { organization: "獣医師監修記事（複数）", title: "猫に魚を与える際の条件に関する解説", url: "", checkedAt: "2026-08-19" },
    ],
  },
  {
    id: "cat_milk",
    displayName: "猫用ミルク",
    image: "assets/foods/food_cat_milk.png",
    display: { scale: 1.00, x: 0, y: 0 },
    level: "beginner",
    difficultyLevel: 2,
    risk: "safe",
    riskCategories: [],
    feedingRecommendation: "occasional",
    correctAction: "eat",
    resultBadge: "食べてOK",
    shortMessage: ["正解！", "猫用ミルクは乳糖を調整してあるから大丈夫。", "人間用の牛乳とは別物だよ。"],
    summary: "猫用に乳糖などが調整されたミルクで、水分補給・嗜好品として与えられます。",
    detail: "人間用の牛乳（caution食品）とは異なり、猫用ミルクは乳糖の量が猫に合わせて"
      + "調整されています。ただし主食の代わりにはならない補助的な飲み物です。",
    mainRisks: [],
    careTips: ["人間用牛乳と間違えない", "水分補給の一つとして少量にする"],
    emergencyAdvice: "",
    sources: [
      { organization: "獣医師監修記事（複数）", title: "猫用ミルクと人間用牛乳の違いに関する解説", url: "", checkedAt: "2026-08-19" },
    ],
  },
  {
    id: "cat_treat",
    displayName: "市販の猫用おやつ",
    image: "assets/foods/food_cat_treat.png",
    display: { scale: 0.97, x: 0, y: 0 },
    level: "beginner",
    difficultyLevel: 1,
    risk: "safe",
    riskCategories: [],
    feedingRecommendation: "occasional",
    correctAction: "eat",
    resultBadge: "食べてOK",
    shortMessage: ["正解！", "猫用おやつは適量なら食べてOK。", "与えすぎには注意してね。"],
    summary: "猫用に作られたおやつです。パッケージの給与量を守って与えます。",
    detail: "safeではありますが、おやつはあくまで補助的な位置づけです。主食の"
      + "代わりに大量に与えると栄養バランスが崩れたり肥満につながることがあります。",
    mainRisks: [],
    careTips: ["パッケージの給与量目安を守る", "1日の量を決めて与えすぎを防ぐ"],
    emergencyAdvice: "",
    sources: [
      { organization: "環境省", title: "飼い主のためのペットフード・ガイドライン ～犬・猫の健康を守るために～", url: "https://www.env.go.jp/nature/dobutsu/aigo/2_data/pamph/petfood_guide_1808.html", checkedAt: "2026-08-19" },
    ],
  },

  {
    id: "cat_wetfood",
    displayName: "猫用ウェットフード",
    image: "assets/foods/food_wet_cat_food.png",
    display: { scale: 0.94, x: 0, y: 0 },
    level: "beginner",
    difficultyLevel: 1,
    risk: "safe",
    riskCategories: [],
    feedingRecommendation: "daily",
    correctAction: "eat",
    resultBadge: "食べてOK",
    shortMessage: ["正解！", "猫用フードはカリカリだけじゃないよ。", "ウェットタイプも総合栄養食ならOK。"],
    summary: "猫用に作られたウェットタイプの総合栄養食です。カリカリ（ドライ）と同じく主食にできます。",
    detail: "猫用フードには乾燥した「カリカリ」だけでなく、水分の多いウェットタイプも"
      + "あります。パッケージに「総合栄養食」と表示されていれば、ドライ・ウェットの"
      + "どちらでも主食として与えられます。水分摂取が増える点もメリットです。",
    mainRisks: [],
    careTips: ["「総合栄養食」の表示を確認する", "開封後は早めに使い切る"],
    emergencyAdvice: "",
    sources: [
      { organization: "環境省", title: "飼い主のためのペットフード・ガイドライン ～犬・猫の健康を守るために～", url: "https://www.env.go.jp/nature/dobutsu/aigo/2_data/pamph/petfood_guide_1808.html", checkedAt: "2026-08-19" },
    ],
  },
  {
    id: "egg_cooked",
    displayName: "加熱した卵（十分加熱・味付けなし）",
    image: "assets/foods/food_egg_cooked.png",
    display: { scale: 1.03, x: 0, y: 0 },
    level: "beginner",
    difficultyLevel: 3,
    risk: "safe",
    riskCategories: [],
    feedingRecommendation: "occasional",
    correctAction: "eat",
    resultBadge: "食べてOK",
    shortMessage: ["正解！", "十分に加熱した卵は食べられるよ。", "生卵とは分けて考えてね。"],
    summary: "十分に加熱し、味付けをしていない卵は良質なたんぱく源として補助的に与えられます。",
    detail: "生卵は、サルモネラ菌による食中毒のリスクに加え、卵白に含まれるアビジンが"
      + "ビオチン（皮膚・被毛に関わるビタミン）の吸収を妨げる可能性が指摘されています。"
      + "十分に加熱することで菌は死滅し、アビジンの働きも失われるため、加熱・味付け"
      + "なしの卵は補助的に与えられる食品になります。ゆで卵やスクランブルエッグ"
      + "（味付けなし）などが適しています。",
    mainRisks: [],
    careTips: ["必ず十分に加熱する（半熟・生は避ける）", "味付け・油を使わない", "少量に留める"],
    emergencyAdvice: "",
    sources: [
      { organization: "獣医師監修記事（複数・独立）", title: "猫と卵（生卵・加熱卵の違い）に関する解説記事各種", url: "", checkedAt: "2026-08-19" },
    ],
  },
  {
    id: "whitefish_cooked",
    displayName: "加熱した白身魚（味付けなし・骨なし）",
    image: "assets/foods/food_whitefish_cooked.png",
    display: { scale: 0.98, x: 0, y: 0 },
    level: "beginner",
    difficultyLevel: 3,
    risk: "safe",
    riskCategories: [],
    feedingRecommendation: "occasional",
    correctAction: "eat",
    resultBadge: "食べてOK",
    shortMessage: ["正解！", "加熱・味付けなし・骨なしの白身魚も食べられるよ。", "魚は種類より「状態」が大事。"],
    summary: "味付けをせず十分に加熱し、骨を取り除いた白身魚は鮭と同様に補助的に与えられます。",
    detail: "鮭だけでなく、タラ等の白身魚も条件付きで安全になる代表例です。生の魚介類に"
      + "含まれるチアミナーゼ（ビタミンB1を壊す酵素）は加熱で失活するため、"
      + "加熱済み・味付けなし・骨なしという条件がそろえば補助的に与えられます。"
      + "「魚の種類」ではなく「加熱してあるかどうか」を見る習慣が大切です。",
    mainRisks: [],
    careTips: ["必ず十分に加熱する", "骨を丁寧に取り除く", "味付き商品と混同しない"],
    emergencyAdvice: "",
    sources: [
      { organization: "獣医師監修記事（複数）", title: "猫に魚を与える際の条件に関する解説", url: "", checkedAt: "2026-08-19" },
    ],
  },

  /* ---------------- CAUTION 4種 ---------------- */
  {
    id: "cow_milk",
    displayName: "牛乳（人間用）",
    image: "assets/foods/food_cow_milk.png",
    display: { scale: 1.07, x: 0, y: 0 },
    level: "beginner",
    difficultyLevel: 2,
    risk: "caution",
    riskCategories: ["digestive_upset"],
    feedingRecommendation: "avoid",
    correctAction: "flick",
    resultBadge: "注意が必要",
    shortMessage: ["正解！", "これは「危険」ではなく注意な食べ物だよ。", "猫は乳糖をうまく消化できないんだ。"],
    summary: "猫は乳糖をうまく消化できず、人間用の牛乳で下痢などの消化器症状を起こすことがあります。",
    detail: "多くの猫は乳糖を分解する酵素（ラクターゼ）が少なく、牛乳を飲むと"
      + "消化しきれない乳糖が腸内に残り、下痢や軟便、お腹の張りなどを引き起こす"
      + "ことがあります。これは中毒ではなく消化器の不耐性によるものです。"
      + "個体差があり、少量なら平気な猫もいます。水分補給には猫用ミルクを選びましょう。",
    mainRisks: ["下痢・軟便", "消化器の不快感"],
    careTips: ["猫用ミルクを選ぶ", "人間用牛乳は基本的に避ける", "少量でも様子を見ながら判断する"],
    emergencyAdvice: "牛乳を飲んで下痢などの症状が続く場合は獣医師に相談してください。",
    sources: [
      { organization: "獣医師監修記事（複数・独立）", title: "猫と牛乳・乳糖不耐症に関する解説（ねこのきもちWEB MAGAZINE／ペトコト／アニコム）", url: "", checkedAt: "2026-08-19" },
    ],
  },
  {
    id: "squid_raw",
    displayName: "生イカ",
    image: "assets/foods/food_squid_raw.png",
    display: { scale: 0.92, x: 0, y: 0 },
    level: "beginner",
    difficultyLevel: 3,
    risk: "caution",
    riskCategories: ["nutrient_deficiency"],
    feedingRecommendation: "avoid",
    correctAction: "flick",
    resultBadge: "注意が必要",
    shortMessage: ["正解！", "生イカにはビタミンB1を壊す酵素が。", "一口くらいで大騒ぎしなくて大丈夫。続けて与えないでね。"],
    summary: "生のイカには、猫に大切なビタミンB1を壊してしまう酵素（チアミナーゼ）が含まれています。",
    detail: "生のイカ・タコなど一部の魚介類には、ビタミンB1（チアミン）を分解する"
      + "酵素チアミナーゼが含まれるとされています。猫は犬よりビタミンB1の必要量が"
      + "多く欠乏しやすい体質です。ただし、これは「毒」ではなく「栄養素が壊れる」"
      + "働きであるため、一口・少量食べた程度でただちに中毒症状が出るわけでは"
      + "ありません。継続的・大量に生の魚介類だけを与え続けた場合にビタミンB1"
      + "欠乏症のリスクが高まるとされています。この酵素は熱に弱く、加熱すれば"
      + "問題になりません。",
    mainRisks: ["ビタミンB1（チアミン）欠乏症（継続摂取した場合。食欲不振・ふらつき等）"],
    careTips: ["生の魚介類を継続して主食代わりに与えない", "与える場合は必ず加熱する"],
    emergencyAdvice: "大量に食べてしまった場合や、元気がない・ふらつく等の体調変化が見られる場合は獣医師に相談してください。少量の誤食で慌てて自己判断による処置をする必要はありません。",
    sources: [
      { organization: "Merck Veterinary Manual", title: "Nutritional Requirements of Small Animals（チアミナーゼによるビタミンB1欠乏の機序）", url: "https://www.merckvetmanual.com/management-and-nutrition/nutrition-small-animals/nutritional-requirements-of-small-animals", checkedAt: "2026-08-19" },
      { organization: "JAVMA（米国獣医師会雑誌）", title: "Thiamine deficiency in dogs and cats, Vol.243 Issue 5", url: "https://avmajournals.avma.org/view/journals/javma/243/5/javma.243.5.649.xml", checkedAt: "2026-08-19" },
      { organization: "獣医師監修記事（複数・独立）", title: "生イカと猫のビタミンB1欠乏に関する解説記事各種", url: "", checkedAt: "2026-08-19" },
    ],
  },
  {
    id: "ham_sausage",
    displayName: "ハム・ソーセージ（加工肉）",
    image: "assets/foods/food_ham_sausage.png",
    display: { scale: 0.92, x: 0, y: 0 },
    level: "beginner",
    difficultyLevel: 3,
    risk: "caution",
    riskCategories: ["human_food_seasoning"],
    feedingRecommendation: "avoid",
    correctAction: "flick",
    resultBadge: "注意が必要",
    shortMessage: ["正解！", "人間用に味付けされていて塩分が多いよ。", "基本的には避けよう。"],
    summary: "ハムやソーセージは人間の味覚に合わせて塩分や香辛料が使われており、猫の体格には塩分の摂りすぎになりやすい食品です。",
    detail: "加工肉そのものが有毒というわけではありません。人間向けに調整された"
      + "塩分・味付けが、猫の身体には想定されていないという点が論点です。"
      + "継続的に与えると塩分の摂りすぎにつながる可能性があります。"
      + "「肉だから安全」という思い込みに注意しましょう。",
    mainRisks: ["塩分の過剰摂取", "肥満・偏食の助長"],
    careTips: ["人間の食事のおすそ分けをしない", "猫用に作られたおやつを選ぶ", "少量でも習慣化しない"],
    emergencyAdvice: "大量に食べてしまった場合や体調の変化が見られる場合は獣医師に相談してください。",
    sources: [
      { organization: "一般的な獣医学的知見", title: "加工食品の塩分と猫の健康に関する解説（実装後に個別の一次資料を追加確認予定）", url: "", checkedAt: "2026-08-19" },
    ],
  },

  {
    id: "raw_meat",
    displayName: "生肉（味付けなし・加熱なし）",
    image: "assets/foods/food_raw_meat.png",
    display: { scale: 0.99, x: 0, y: 0 },
    level: "beginner",
    difficultyLevel: 3,
    risk: "caution",
    riskCategories: ["pathogen_risk"],
    feedingRecommendation: "avoid",
    correctAction: "flick",
    resultBadge: "注意が必要",
    shortMessage: ["正解！", "「肉食＝生肉も平気」ではないよ。", "サルモネラ菌などの汚染リスクがあるんだ。"],
    summary: "猫は肉食動物ですが、生肉にはサルモネラ菌等の食中毒菌や寄生虫が付着している可能性があります。",
    detail: "「猫は肉食動物だから生肉でも平気」というのは誤解です。生肉には"
      + "サルモネラ・カンピロバクター等の食中毒菌や、トキソプラズマ等の寄生虫が"
      + "付着している可能性があり、猫自身が体調を崩すだけでなく、飼い主への"
      + "感染（人獣共通感染症）にもつながりえます。また、生肉だけを継続的に"
      + "主食として与えると、タウリンなど必要な栄養素が偏るおそれもあります。"
      + "これは「毒」による中毒ではなく、衛生面・栄養バランス面の注意です。",
    mainRisks: ["食中毒菌・寄生虫による感染", "継続摂取時の栄養バランスの偏り"],
    careTips: ["与えるなら加熱してから与える", "生肉を継続して主食にしない", "調理器具・手指の衛生に気をつける"],
    emergencyAdvice: "食べた後に嘔吐・下痢・元気消失などの症状が見られる場合は獣医師に相談してください。",
    sources: [
      { organization: "Today's Veterinary Nurse（PMC掲載）", title: "Raw Meat-Based Diets for Cats and Dogs", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5644655/", checkedAt: "2026-08-19" },
      { organization: "獣医師監修記事（複数）", title: "猫と生肉食（生食）のリスクに関する解説記事各種", url: "", checkedAt: "2026-08-19" },
    ],
  },

  /* ---------------- DANGER 7種 ---------------- */
  {
    id: "onion",
    displayName: "玉ねぎ",
    image: "assets/foods/food_onion.png",
    display: { scale: 0.96, x: 0, y: 0 },
    level: "beginner",
    difficultyLevel: 1,
    risk: "danger",
    riskCategories: ["toxin"],
    feedingRecommendation: "never",
    correctAction: "flick",
    resultBadge: "猫には与えない",
    shortMessage: ["正解！", "玉ねぎはNG！", "ネギ類は猫に有害。加熱しても与えないで。"],
    summary: "ネギ類（玉ねぎ・長ねぎ・にんにくなど）に含まれる成分が赤血球を壊し、貧血を引き起こします。",
    detail: "玉ねぎなどネギ属の植物に含まれる有機チオ硫酸化合物が、猫の赤血球を"
      + "酸化的に傷害し、溶血性貧血を引き起こすとされています。加熱・乾燥"
      + "（オニオンパウダー等）しても毒性は消えません。スープなど汁だけでも危険です。",
    mainRisks: ["溶血性貧血", "血色素尿", "元気消失", "食欲不振"],
    careTips: ["調理中に落とした欠片をすぐ拾う", "汁物も食卓に放置しない", "家族全員で危険性を共有する"],
    emergencyAdvice: "誤食が疑われる場合は、自己判断で様子を見ず、獣医師・動物病院へ相談してください。",
    sources: [
      { organization: "環境省", title: "飼い主のためのペットフード・ガイドライン ～犬・猫の健康を守るために～", url: "https://www.env.go.jp/nature/dobutsu/aigo/2_data/pamph/petfood_guide_1808.html", checkedAt: "2026-08-19" },
      { organization: "ASPCA", title: "People Foods to Avoid Feeding Your Pets", url: "https://www.aspca.org/pet-care/aspca-poison-control/people-foods-avoid-feeding-your-pets", checkedAt: "2026-08-19" },
      { organization: "Cornell Feline Health Center", title: "Feeding Your Cat", url: "https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/feeding-your-cat", checkedAt: "2026-08-19" },
    ],
  },
  {
    id: "garlic",
    displayName: "にんにく",
    image: "assets/foods/food_garlic.png",
    display: { scale: 1.01, x: 0, y: 0 },
    level: "beginner",
    difficultyLevel: 2,
    risk: "danger",
    riskCategories: ["toxin"],
    feedingRecommendation: "never",
    correctAction: "flick",
    resultBadge: "猫には与えない",
    shortMessage: ["正解！", "にんにくもネギ属でNG！", "玉ねぎと同じ理由で危険だよ。"],
    summary: "にんにくは玉ねぎと同じネギ属で、同じ機序で赤血球を傷害し貧血を引き起こします。",
    detail: "にんにくは玉ねぎと同じネギ属の植物で、有機チオ硫酸化合物による"
      + "溶血性貧血のリスクは共通です。少量の料理の風味付けにもよく使われるため、"
      + "料理に紛れ込みやすい点にも注意が必要です。",
    mainRisks: ["溶血性貧血", "血色素尿", "元気消失", "食欲不振"],
    careTips: ["料理に使われていないか確認する", "にんにく風味の加工食品にも注意する"],
    emergencyAdvice: "誤食が疑われる場合は、自己判断で様子を見ず、獣医師・動物病院へ相談してください。",
    sources: [
      { organization: "環境省", title: "飼い主のためのペットフード・ガイドライン ～犬・猫の健康を守るために～", url: "https://www.env.go.jp/nature/dobutsu/aigo/2_data/pamph/petfood_guide_1808.html", checkedAt: "2026-08-19" },
      { organization: "ASPCA", title: "People Foods to Avoid Feeding Your Pets", url: "https://www.aspca.org/pet-care/aspca-poison-control/people-foods-avoid-feeding-your-pets", checkedAt: "2026-08-19" },
    ],
  },
  {
    id: "chocolate",
    displayName: "チョコレート",
    image: "assets/foods/food_chocolate.png",
    display: { scale: 0.95, x: 0, y: 0 },
    level: "beginner",
    difficultyLevel: 1,
    risk: "danger",
    riskCategories: ["toxin"],
    feedingRecommendation: "never",
    correctAction: "flick",
    resultBadge: "猫には与えない",
    shortMessage: ["正解！", "チョコレートは絶対NG！", "テオブロミンという成分が中毒を起こすよ。"],
    summary: "チョコレートに含まれる成分（テオブロミン等）は猫に中毒を起こします。",
    detail: "チョコレートに含まれるテオブロミンとカフェイン（メチルキサンチン類）は"
      + "猫の神経・心臓に作用し、中毒を引き起こします。色が濃いチョコレートほど"
      + "含有量が多く、危険性が高いとされています。",
    mainRisks: ["嘔吐", "下痢", "興奮", "けいれん", "不整脈"],
    careTips: ["机の上に放置しない", "包み紙ごと誤食されない場所に保管する"],
    emergencyAdvice: "食べた量や種類をメモし、すみやかに獣医師・動物病院に相談してください。",
    sources: [
      { organization: "ASPCA Pet Insurance", title: "Top 10 Unsafe Foods for Cats", url: "https://www.aspcapetinsurance.com/resources/top-10-unsafe-foods-for-cats/", checkedAt: "2026-08-19" },
      { organization: "PetMD", title: "What Can't Cats Eat? 8 Toxic Foods for Cats", url: "https://www.petmd.com/cat/nutrition/toxic-foods-for-cats", checkedAt: "2026-08-19" },
    ],
  },
  {
    id: "coffee",
    displayName: "コーヒー等カフェイン飲料",
    image: "assets/foods/food_coffee.png",
    display: { scale: 1.16, x: 0, y: 0 },
    level: "beginner",
    difficultyLevel: 2,
    risk: "danger",
    riskCategories: ["toxin"],
    feedingRecommendation: "never",
    correctAction: "flick",
    resultBadge: "猫には与えない",
    shortMessage: ["正解！", "カフェインもNG！", "飲み物にも危険なものがあるよ。"],
    summary: "コーヒーなどカフェインを含む飲み物は、チョコレートと同系統の中毒（メチルキサンチン中毒）を起こします。",
    detail: "カフェインはチョコレートの成分と同じメチルキサンチン類に分類され、"
      + "神経・心臓に作用して中毒を引き起こします。食べ物だけでなく飲み物にも"
      + "危険なものがあるという理解を広げる代表例です。",
    mainRisks: ["嘔吐", "興奮", "頻脈", "けいれん"],
    careTips: ["飲みかけのカップを放置しない", "エナジードリンク等も同様に注意する"],
    emergencyAdvice: "誤って口にした場合はすみやかに獣医師・動物病院に相談してください。",
    sources: [
      { organization: "ASPCA Pet Insurance", title: "Top 10 Unsafe Foods for Cats", url: "https://www.aspcapetinsurance.com/resources/top-10-unsafe-foods-for-cats/", checkedAt: "2026-08-19" },
      { organization: "Cornell Feline Health Center", title: "Feeding Your Cat", url: "https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/feeding-your-cat", checkedAt: "2026-08-19" },
    ],
  },
  {
    id: "alcohol",
    displayName: "アルコール（お酒）",
    image: "assets/foods/food_alcohol.png",
    display: { scale: 1.03, x: 0, y: 0 },
    level: "beginner",
    difficultyLevel: 1,
    risk: "danger",
    riskCategories: ["toxin"],
    feedingRecommendation: "never",
    correctAction: "flick",
    resultBadge: "猫には与えない",
    shortMessage: ["正解！", "アルコールは微量でも絶対NG！", "なめる程度でも危険だよ。"],
    summary: "猫はアルコールを分解する酵素を持たず、微量でも中毒を起こすことがあります。",
    detail: "猫はヒトのようにアルコールを効率よく分解する酵素を十分に持っていません。"
      + "そのため、ほんの一口・なめる程度でも血中にアルコールが残り、脳や肝臓など"
      + "重要な臓器にダメージを与える可能性があります。",
    mainRisks: ["足のふらつき", "意識の低下", "反応の鈍化", "重篤な場合は死に至ることも"],
    careTips: ["飲みかけのグラスを放置しない", "こぼした酒をすぐ拭き取る"],
    emergencyAdvice: "誤飲・誤食が疑われる場合は自己判断せず、すぐに獣医師・動物病院に相談してください。",
    sources: [
      { organization: "獣医師監修記事（複数・独立）", title: "猫とアルコール中毒に関する解説記事各種（ペトコト／PS保険／ねこのきもちWEB MAGAZINE／救急獣医師解説）", url: "", checkedAt: "2026-08-19" },
    ],
  },
  {
    id: "green_onion",
    displayName: "長ねぎ",
    image: "assets/foods/food_green_onion.png",
    display: { scale: 0.93, x: 0, y: 0 },
    level: "beginner",
    difficultyLevel: 3,
    risk: "danger",
    riskCategories: ["toxin"],
    feedingRecommendation: "never",
    correctAction: "flick",
    resultBadge: "猫には与えない",
    shortMessage: ["正解！", "長ねぎも玉ねぎと同じネギ属でNG！", "「ネギ類」というグループで覚えよう。"],
    summary: "長ねぎは玉ねぎ・にんにくと同じネギ属で、同じ機序で赤血球を傷害し貧血を引き起こします。",
    detail: "危険なのは玉ねぎだけではありません。長ねぎ（青ねぎ・ねぎ類）も玉ねぎ・"
      + "にんにくと同じネギ属の植物で、含まれる有機チオ硫酸化合物が赤血球を"
      + "酸化的に傷害し、溶血性貧血を引き起こします。加熱・乾燥しても毒性は"
      + "消えません。「玉ねぎさえ避ければよい」ではなく「ネギ属（Allium属）は"
      + "すべて危険」というグループで理解することが大切です。",
    mainRisks: ["溶血性貧血", "血色素尿", "元気消失", "食欲不振"],
    careTips: ["すき焼き・鍋料理の長ねぎに注意する", "薬味の刻みねぎも同様に危険", "汁だけでも与えない"],
    emergencyAdvice: "誤食が疑われる場合は、自己判断で様子を見ず、獣医師・動物病院へ相談してください。",
    sources: [
      { organization: "Merck Veterinary Manual", title: "Garlic and Onion (Allium spp) Toxicosis in Animals", url: "https://www.merckvetmanual.com/toxicology/food-hazards/garlic-and-onion-allium-spp-toxicosis-in-animals", checkedAt: "2026-08-19" },
      { organization: "ASPCA", title: "People Foods to Avoid Feeding Your Pets", url: "https://www.aspca.org/pet-care/aspca-poison-control/people-foods-avoid-feeding-your-pets", checkedAt: "2026-08-19" },
    ],
  },
  {
    id: "cocoa",
    displayName: "ココア（純ココアパウダー）",
    image: "assets/foods/food_cocoa.png",
    display: { scale: 0.95, x: 0, y: 0 },
    level: "beginner",
    difficultyLevel: 3,
    risk: "danger",
    riskCategories: ["toxin"],
    feedingRecommendation: "never",
    correctAction: "flick",
    resultBadge: "猫には与えない",
    shortMessage: ["正解！", "板チョコだけじゃなくココアもNG！", "むしろ粉末の方が成分が濃いんだ。"],
    summary: "ココアパウダーはチョコレートと同じ原料（カカオ）由来で、テオブロミンの濃度はチョコレートより高い場合があります。",
    detail: "「板チョコさえ避ければよい」というのは誤解です。ココアパウダーは"
      + "チョコレートと同じカカオが原料で、中毒の原因となるテオブロミンを"
      + "含みます。しかも純度の高いココアパウダーは、重量あたりのテオブロミン"
      + "濃度がミルクチョコレートより高いことがあり、少量でも油断できません。"
      + "焼き菓子作りのココア、ホットココアの粉末なども同じ「カカオ由来食品」"
      + "として注意が必要です。",
    mainRisks: ["嘔吐", "下痢", "興奮", "けいれん", "不整脈"],
    careTips: ["製菓材料のココアパウダーを出しっぱなしにしない", "ホットココアの粉末も保管に注意する"],
    emergencyAdvice: "食べた量や種類をメモし、すみやかに獣医師・動物病院に相談してください。",
    sources: [
      { organization: "Merck Veterinary Manual", title: "Chocolate Toxicosis in Animals", url: "https://www.merckvetmanual.com/toxicology/food-hazards/chocolate-toxicosis-in-animals", checkedAt: "2026-08-19" },
      { organization: "ASPCA Pet Insurance", title: "Top 10 Unsafe Foods for Cats", url: "https://www.aspcapetinsurance.com/resources/top-10-unsafe-foods-for-cats/", checkedAt: "2026-08-19" },
    ],
  },
];

/* =========================================================
 * 中級・上級編は現時点で未実装（データなし）。
 * 以下は将来の中級候補としての参考メモであり、ゲームには反映しない。
 *   - 生卵（卵白）／骨付き加熱鶏肉／生の鶏骨
 *   ※長ねぎは初級19食品へ正式採用済み（加熱した卵は初級のsafe食品として採用済み。
 *     中級では「生卵」との対比教材として別途扱う想定）
 * 詳細は docs/foods-beginner-design.md 参照。
 * ========================================================= */

// 難易度モード。intermediate/advanced はデータが揃うまで enabled:false とし、
// 「準備中」表示にする。初級データの使い回し（フォールバック）は行わない。
const DIFFICULTY_MODES = {
  beginner: {
    id: "beginner",
    label: "初級",
    subLabel: "食材を覚える",
    level: "beginner",
    difficultyWeight: 1.0,
    enabled: true,
  },
  intermediate: {
    id: "intermediate",
    label: "中級",
    subLabel: "準備中",
    level: "intermediate",
    difficultyWeight: 1.25,
    enabled: false,
  },
  advanced: {
    id: "advanced",
    label: "上級",
    subLabel: "準備中",
    level: "advanced",
    difficultyWeight: 1.5,
    enabled: false,
  },
};

// ゲーム操作上の正解アクションを返すヘルパー（データのcorrectActionを優先し、
// 万一未設定の場合はriskから自動導出するフォールバックとして残す）
function correctActionFor(food) {
  return food.correctAction || (food.risk === "safe" ? "eat" : "flick");
}

// riskCategoriesの内部IDを日本語ラベルへ変換（図鑑・結果画面表示用）
const RISK_CATEGORY_LABELS = {
  toxin: "🧪 中毒性のある成分",
  nutrient_deficiency: "🍽 栄養素の破壊・欠乏",
  digestive_upset: "😿 消化器の不調",
  human_food_seasoning: "🧂 人間用の味付け・塩分",
  pathogen_risk: "🦠 細菌・寄生虫のリスク",
};

// feedingRecommendationの内部IDを日本語ラベルへ変換
const FEEDING_RECOMMENDATION_LABELS = {
  daily: "毎日の主食にできる",
  occasional: "たまに・補助的に",
  avoid: "基本的には避ける",
  never: "絶対に与えない",
};
