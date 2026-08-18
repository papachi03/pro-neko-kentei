/* =========================================================
 * ぷろ猫けんてい - 食品データ（初級編 正式版）
 * =========================================================
 * 初級編13食品は docs/foods-beginner-design.md の設計・調査を経て
 * 正式確定した内容です（環境省ガイドライン・ASPCA・Cornell Feline
 * Health Center・Merck Veterinary Manual・JAVMA・日本の獣医師監修
 * 記事等を根拠資料として使用）。
 *
 * 画像は正式イラスト（assets/foods/）を使用。ゲームロジックはこの
 * データ構造にのみ依存しており、本ファイルを差し替えるだけで
 * 情報を更新できる。
 *
 * risk（医学的な安全性の3分類）と feedingRecommendation（推奨頻度）
 * は独立した軸。「safe＝好きなだけ与えてよい」という誤解を防ぐため
 * 意図的に分離している。
 * ========================================================= */

const FOOD_DATA_STATUS = "verified-beginner"; // 初級13食品は正式確定済み

// risk: "safe" | "caution" | "danger"（医学的安全性）
// feedingRecommendation: "daily" | "occasional" | "avoid" | "never"（推奨頻度。riskとは別軸）
// correctAction: "eat" | "flick"（ゲーム操作としての正解）
// riskCategories: 危険・注意理由のカテゴリ（複数可）
//   toxin                … 特定成分による中毒
//   nutrient_deficiency  … 栄養素の破壊・吸収阻害（毒ではない）
//   digestive_upset      … 中毒ではなく消化器症状
//   human_food_seasoning … 人間向けの味付け・塩分（添加物=毒という意味ではない）
// display: { scale, x, y } … 食品ごとの画像占有率の違いを吸収し、皿の上での見た目サイズを揃える補正値

const FOODS = [
  /* ---------------- SAFE 5種 ---------------- */
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

  /* ---------------- CAUTION 3種 ---------------- */
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

  /* ---------------- DANGER 5種 ---------------- */
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
];

/* =========================================================
 * 中級・上級編は現時点で未実装（データなし）。
 * 以下は将来の中級候補としての参考メモであり、ゲームには反映しない。
 *   - 生卵（卵白）／骨付き加熱鶏肉／長ねぎ／生の鶏骨
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
};

// feedingRecommendationの内部IDを日本語ラベルへ変換
const FEEDING_RECOMMENDATION_LABELS = {
  daily: "毎日の主食にできる",
  occasional: "たまに・補助的に",
  avoid: "基本的には避ける",
  never: "絶対に与えない",
};
