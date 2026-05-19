// 受験生に人気の参考書データ
// 偏差値帯/科目別の標準ルートで使われる代表書
// TODO: 実データに置き換え（書店APIや手動登録）

import type { GradeId } from "./curriculum";

export type Textbook = {
  id: string;
  name: string;
  publisher: string;
  subject: string; // category id from curriculum
  level: "basic" | "standard" | "advanced" | "top"; // 基礎/標準/応用/最難関
  forGrades: GradeId[];
  description: string;
  tags: string[];
};

export const TEXTBOOKS: Textbook[] = [
  // ================================================================
  // 数学
  // ================================================================

  {
    id: "tb-math-white-chart",
    name: "白チャート（チャート式 基礎と演習）",
    publisher: "数研出版",
    subject: "math",
    level: "basic",
    forGrades: ["h1", "h2", "h3"],
    description:
      "チャート式最易。教科書レベルの丁寧な解説で初学者に最適。共通テスト実践編付。",
    tags: ["網羅系", "基礎", "共通テスト"],
  },
  {
    id: "tb-math-yellow-chart",
    name: "黄チャート（チャート式 解法と演習）",
    publisher: "数研出版",
    subject: "math",
    level: "standard",
    forGrades: ["h1", "h2", "h3", "ronin"],
    description:
      "教科書〜共通テスト〜中堅大対応。例題網羅型の王道。準進学校の副教材として広く採用。",
    tags: ["網羅系", "例題"],
  },
  {
    id: "tb-math-blue-chart",
    name: "青チャート（チャート式 基礎からの数学）",
    publisher: "数研出版",
    subject: "math",
    level: "advanced",
    forGrades: ["h1", "h2", "h3", "ronin"],
    description:
      "難関大志望の定番。例題＋エクササイズ＋総合演習で入試標準〜応用まで網羅。進学校で最多採用。",
    tags: ["網羅系", "難関大"],
  },
  {
    id: "tb-math-red-chart",
    name: "赤チャート（チャート式 数学）",
    publisher: "数研出版",
    subject: "math",
    level: "top",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "チャート式最難。旧帝大で数学を得点源にする受験生向け。発展例題・研究問題まで収録。",
    tags: ["網羅系", "最難関", "旧帝大"],
  },
  {
    id: "tb-math-focus-gold",
    name: "Focus Gold（フォーカスゴールド）",
    publisher: "啓林館",
    subject: "math",
    level: "advanced",
    forGrades: ["h1", "h2", "h3", "ronin"],
    description:
      "青チャート同等の網羅系。マスター編＋チャレンジ編の2部構成で教科書レベルから東大合格水準まで1冊で完結。解説の質が高い。",
    tags: ["網羅系", "難関大"],
  },
  {
    id: "tb-math-nyumon-seiko",
    name: "入門問題精講（数学I+A / II+B）",
    publisher: "旺文社",
    subject: "math",
    level: "basic",
    forGrades: ["h1", "h2"],
    description:
      "数学初学者・やり直し向け。各単元の考え方・公式を丁寧に解説後に例題演習。基礎問題精講の前ステップ。",
    tags: ["基礎", "薄め"],
  },
  {
    id: "tb-math-kihon-seiko",
    name: "基礎問題精講（数学I+A / II+B+C / III+C）",
    publisher: "旺文社",
    subject: "math",
    level: "basic",
    forGrades: ["h1", "h2", "h3", "ronin"],
    description:
      "基礎を素早く固めたい受験生に。1冊150題ほど。厳選された問題で効率的に基礎完成。網羅系より薄く使いやすい。",
    tags: ["基礎", "薄め"],
  },
  {
    id: "tb-math-standard-seiko",
    name: "標準問題精講（数学I+A / II+B+C / III）",
    publisher: "旺文社",
    subject: "math",
    level: "advanced",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "難関大の標準問題に強い。精講欄で考え方を学んでから演習。基礎問の次に使う発展問題集。",
    tags: ["難関大", "演習"],
  },
  {
    id: "tb-math-jokyu-seiko",
    name: "上級問題精講（数学I+A+II+B / III）",
    publisher: "旺文社",
    subject: "math",
    level: "top",
    forGrades: ["h3", "ronin"],
    description:
      "プラチカ・やさ理より難しい最上位問題集。東大・京大・医学部で数学を武器にする受験生向け。問題数は少なく質で勝負。",
    tags: ["最難関", "旧帝大"],
  },
  {
    id: "tb-math-1taich",
    name: "1対1対応の演習（数学I / II / III / A / B / C）",
    publisher: "東京出版",
    subject: "math",
    level: "advanced",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "1問1問の質が高い厳選演習書。各テーマを典型例題1問で凝縮し別解を豊富に掲載。東大・京大・早慶志望に。",
    tags: ["1対1", "難関大"],
  },
  {
    id: "tb-math-yasashi-riko",
    name: "やさしい理系数学",
    publisher: "河合出版",
    subject: "math",
    level: "top",
    forGrades: ["h3", "ronin"],
    description:
      "タイトルに反し難しい。150問の厳選良問で難関国公立・医学部対応。解説に多彩なアプローチを収録。",
    tags: ["最難関", "演習"],
  },
  {
    id: "tb-math-platinum-riko",
    name: "理系数学の良問プラチカ（I+A+II+B+C / III）",
    publisher: "河合出版",
    subject: "math",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "全国難関大の入試問題から厳選した良問演習集。理系プラチカIAIIBは入試基礎〜標準、IIIは難関国公立レベル。",
    tags: ["演習", "難関大"],
  },
  {
    id: "tb-math-platinum-bun",
    name: "文系数学の良問プラチカ（I+A+II+B）",
    publisher: "河合出版",
    subject: "math",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "文系最高レベルの問題集。早慶・難関国公立文系の数学で高得点を狙う受験生向け。",
    tags: ["演習", "難関大"],
  },
  {
    id: "tb-math-daigaku-eno",
    name: "新数学スタンダード演習",
    publisher: "東京出版",
    subject: "math",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "月刊「大学への数学」の年度別問題集。厳選された入試問題の体系的演習。難関大対策に最適。",
    tags: ["演習", "難関大"],
  },
  {
    id: "tb-math-jushi-mondaishu",
    name: "数学重要問題集（I・II・III・A・B・C）",
    publisher: "数研出版",
    subject: "math",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "全国の入試問題からA問題（標準）とB問題（発展）に分類して収録。理系300問・文系250問程度。",
    tags: ["演習", "難関大"],
  },
  {
    id: "tb-math-kyotsute-chart",
    name: "共通テスト対策 チャート式 数学",
    publisher: "数研出版",
    subject: "math",
    level: "standard",
    forGrades: ["h3", "ronin"],
    description:
      "共通テスト形式に特化。基本例題→重要例題→実践問題の4部構成。予想問題1回分付。",
    tags: ["共通テスト", "演習"],
  },
  {
    id: "tb-math-master-seisu",
    name: "マスター・オブ・整数",
    publisher: "東京出版",
    subject: "math",
    level: "top",
    forGrades: ["h3", "ronin"],
    description:
      "整数問題に特化した最難関演習書。東大・京大の整数問題を中心に難問を徹底解説。",
    tags: ["最難関", "演習"],
  },
  {
    id: "tb-math-master-kakuritsu",
    name: "マスター・オブ・場合の数",
    publisher: "東京出版",
    subject: "math",
    level: "top",
    forGrades: ["h3", "ronin"],
    description:
      "場合の数・確率に特化。東大・京大レベルの高難度問題を丁寧に解説。数学マニア向け。",
    tags: ["最難関", "演習"],
  },

  // ================================================================
  // 英語 — 単語帳
  // ================================================================

  {
    id: "tb-eng-target1200",
    name: "英単語ターゲット1200",
    publisher: "旺文社",
    subject: "english",
    level: "basic",
    forGrades: ["h1", "h2"],
    description:
      "ターゲットシリーズの基礎版。高校必修単語1200語を収録。共通テスト基礎レベルの入口に。",
    tags: ["単語", "基礎"],
  },
  {
    id: "tb-eng-target1900",
    name: "英単語ターゲット1900",
    publisher: "旺文社",
    subject: "english",
    level: "standard",
    forGrades: ["h1", "h2", "h3", "ronin"],
    description:
      "受験必須単語1900語。見出し語→例文→派生語の構成で共通テスト〜難関私大まで対応。赤シート付。",
    tags: ["単語"],
  },
  {
    id: "tb-eng-system",
    name: "システム英単語（Basic / 標準・上級）",
    publisher: "駿台文庫",
    subject: "english",
    level: "standard",
    forGrades: ["h1", "h2", "h3", "ronin"],
    description:
      "ミニマルフレーズ（2〜3語のかたまり）で覚える駿台定番。2021語収録。難関私大〜国公立まで。",
    tags: ["単語"],
  },
  {
    id: "tb-eng-duo30",
    name: "DUO 3.0",
    publisher: "アイシーピー",
    subject: "english",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "1文に重要単語・熟語を3〜4個埋め込んだ560例文。繰り返し音読で定着。社会人にも人気。CEFR B2相当。",
    tags: ["単語", "熟語"],
  },
  {
    id: "tb-eng-teppeki",
    name: "鉄壁（鉄緑会 東大英単語熟語）",
    publisher: "KADOKAWA",
    subject: "english",
    level: "advanced",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "東大合格者御用達。語源・派生語・関連語を系統的に整理。約3000語収録。基本単語習得後の強化に。",
    tags: ["単語", "難関大"],
  },
  {
    id: "tb-eng-stock4500",
    name: "Stock 4500（英単語・熟語）",
    publisher: "文英堂",
    subject: "english",
    level: "advanced",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "単語4500語＋熟語を収録した大容量単語帳。MARCH〜早慶レベルまで対応。ユニット学習で効率よく習得。",
    tags: ["単語", "熟語"],
  },
  {
    id: "tb-eng-sokutan-hisshu",
    name: "速読英単語 必修編",
    publisher: "Z会",
    subject: "english",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "長文を読みながら単語を覚えるZ会の定番。日常的なトピックで65の長文に頻出単語を配置。共通テスト〜MARCH。",
    tags: ["単語", "長文"],
  },
  {
    id: "tb-eng-sokutan-jokyu",
    name: "速読英単語 上級編",
    publisher: "Z会",
    subject: "english",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "長文×難関単語の組合せ。早慶・難関国公立レベルの英文で上級語彙を習得。必修編修了後に使用。",
    tags: ["単語", "長文", "難関大"],
  },
  {
    id: "tb-eng-lingame",
    name: "話題別英単語 リンガメタリカ",
    publisher: "Z会",
    subject: "english",
    level: "top",
    forGrades: ["h3", "ronin"],
    description:
      "テーマ別専門語彙。医療・環境・政治・経済など21分野の長文＋専門語彙を習得。東大・早慶上智の論説文対策に。",
    tags: ["単語", "最難関"],
  },
  {
    id: "tb-eng-sokujuku-jukugo",
    name: "システム英熟語",
    publisher: "駿台文庫",
    subject: "english",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "熟語専門の駿台参考書。1000熟語をコアイメージで解説。シス単と併用で英語の総合力が上がる。",
    tags: ["熟語"],
  },
  {
    id: "tb-eng-stock4500-jukugo",
    name: "速読英熟語",
    publisher: "Z会",
    subject: "english",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "60の長文を読みながら750の重要熟語を習得。速読英単語と同じシリーズで相性が良い。",
    tags: ["熟語", "長文"],
  },

  // ================================================================
  // 英語 — 文法
  // ================================================================

  {
    id: "tb-eng-nextstage",
    name: "Next Stage（ネクステージ）英文法・語法",
    publisher: "桐原書店",
    subject: "english",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "文法・語法・イディオム・会話表現を1冊網羅。見開きで問題と解説を確認。日東駒専〜MARCH下位レベルで定番。",
    tags: ["文法"],
  },
  {
    id: "tb-eng-vintage",
    name: "Vintage（英文法・語法）",
    publisher: "いいずな書店",
    subject: "english",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "1526題収録の大ボリューム。YouTubeで著者講義を視聴しながら学べる。ネクステより一段難しく早慶も射程。",
    tags: ["文法"],
  },
  {
    id: "tb-eng-scramble",
    name: "Scramble（英文法・語法）",
    publisher: "旺文社",
    subject: "english",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "3ステップ構成（Basic→Standard→Advanced）で段階的に文法を習得。問題の解説が丁寧で初学者にも親切。",
    tags: ["文法"],
  },
  {
    id: "tb-eng-power-stage",
    name: "POWER STAGE 英文法・語法",
    publisher: "数研出版",
    subject: "english",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "1079問収録。最新の入試傾向に対応し2016年初版と比較的新しい。文法問題の網羅性が高く難関大対策にも使える。",
    tags: ["文法"],
  },
  {
    id: "tb-eng-evergreen",
    name: "Evergreen（総合英語）",
    publisher: "いいずな書店",
    subject: "english",
    level: "standard",
    forGrades: ["h1", "h2", "h3", "ronin"],
    description:
      "Forest（フォレスト）の改訂版。英文法の解説書として完成度が高く、辞書的に使える。Vintageと同出版社。",
    tags: ["文法", "参考書"],
  },
  {
    id: "tb-eng-eibunpo-goho-1000",
    name: "英文法・語法問題 Next1000（頻出英文法・語法）",
    publisher: "桐原書店",
    subject: "english",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "難関大向け文法・語法問題1000問。大学入試で頻出の語法を徹底演習。早慶文系の英語対策に。",
    tags: ["文法", "難関大"],
  },

  // ================================================================
  // 英語 — 読解・解釈
  // ================================================================

  {
    id: "tb-eng-eibunkaisyaku-100",
    name: "英文解釈の技術100（基礎・標準・上級）",
    publisher: "桐原書店",
    subject: "english",
    level: "advanced",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "CD付。構文解析を徹底的にトレーニングする解釈書。入門70→基礎100→100の3段階シリーズ。難関国公立対応。",
    tags: ["読解", "解釈", "難関大"],
  },
  {
    id: "tb-eng-polepole",
    name: "ポレポレ英文読解プロセス50",
    publisher: "代々木ライブラリー",
    subject: "english",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "50例文で英文読解の「考え方のプロセス」を習得。節の区切りが難しい文を厳選。早慶・難関国公立志望の仕上げに。",
    tags: ["読解", "解釈", "難関大"],
  },
  {
    id: "tb-eng-toushizu",
    name: "英文読解の透視図",
    publisher: "研究社",
    subject: "english",
    level: "top",
    forGrades: ["h3", "ronin"],
    description:
      "最難関レベルの英文解釈書。多義的な英文の解釈プロセスを徹底解説。東大・京大・医学部志望向け。",
    tags: ["読解", "解釈", "最難関"],
  },
  {
    id: "tb-eng-yakkai300",
    name: "やっておきたい英語長文300",
    publisher: "河合出版",
    subject: "english",
    level: "standard",
    forGrades: ["h2", "h3"],
    description:
      "共通テスト〜中堅大レベルの300語前後の長文30問収録。記述問題中心。国公立志望の基礎演習に。",
    tags: ["長文"],
  },
  {
    id: "tb-eng-yakkai500",
    name: "やっておきたい英語長文500",
    publisher: "河合出版",
    subject: "english",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "500語前後の長文20問。MARCH〜関関同立レベル。要約問題付きで読解力と要約力を同時に鍛える。",
    tags: ["長文"],
  },
  {
    id: "tb-eng-yakkai700",
    name: "やっておきたい英語長文700",
    publisher: "河合出版",
    subject: "english",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "700語前後の難関レベル長文。関関同立難関〜早慶レベル。要約や本文内容説明問題が中心。",
    tags: ["長文", "難関大"],
  },
  {
    id: "tb-eng-yakkai1000",
    name: "やっておきたい英語長文1000",
    publisher: "河合出版",
    subject: "english",
    level: "top",
    forGrades: ["h3", "ronin"],
    description:
      "1000語超の超長文で最難関訓練。東大・京大など記述試験の最終仕上げに。問題数より質重視。",
    tags: ["長文", "最難関"],
  },
  {
    id: "tb-eng-rules1",
    name: "関正生のThe Rules 英語長文問題集1（入試基礎）",
    publisher: "旺文社",
    subject: "english",
    level: "basic",
    forGrades: ["h2", "h3"],
    description:
      "「確固たるルールで読む」長文問題集。1は高校基礎〜共通テストレベル。音声アプリ対応。読み方の型を習得。",
    tags: ["長文"],
  },
  {
    id: "tb-eng-rules2",
    name: "関正生のThe Rules 英語長文問題集2（入試標準）",
    publisher: "旺文社",
    subject: "english",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "共通テスト〜日東駒専レベル。The Rules1修了後に取り組む標準長文演習。ルールを使って読む訓練。",
    tags: ["長文"],
  },
  {
    id: "tb-eng-rules3",
    name: "関正生のThe Rules 英語長文問題集3（入試難関）",
    publisher: "旺文社",
    subject: "english",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "産近甲龍〜MARCH/関関同立レベル。難関大頻出の論説文を中心に難易度が上がる。",
    tags: ["長文", "難関大"],
  },
  {
    id: "tb-eng-rules4",
    name: "関正生のThe Rules 英語長文問題集4（入試最難関）",
    publisher: "旺文社",
    subject: "english",
    level: "top",
    forGrades: ["h3", "ronin"],
    description:
      "MARCH〜早慶上智レベルの最難関長文。学術論文レベルの英文を精読・速読の両立で解く。",
    tags: ["長文", "最難関"],
  },
  {
    id: "tb-eng-polaris1",
    name: "英語長文ポラリス1（標準）",
    publisher: "KADOKAWA",
    subject: "english",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "関正生監修の長文問題集。1は日東駒専〜MARCH下位レベル。設問に理由説明が充実。",
    tags: ["長文"],
  },
  {
    id: "tb-eng-polaris2",
    name: "英語長文ポラリス2（応用）",
    publisher: "KADOKAWA",
    subject: "english",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "MARCH〜早慶レベルの応用長文。難関校の英文を構造的に読み解く演習。",
    tags: ["長文", "難関大"],
  },
  {
    id: "tb-eng-polaris3",
    name: "英語長文ポラリス3（発展）",
    publisher: "KADOKAWA",
    subject: "english",
    level: "top",
    forGrades: ["h3", "ronin"],
    description:
      "早慶〜最難関レベルの発展長文。大学入試最高難度の英文をルールで解析。",
    tags: ["長文", "最難関"],
  },

  // ================================================================
  // 英語 — 英作文
  // ================================================================

  {
    id: "tb-eng-eisakubun-hyper",
    name: "大矢英作文ハイパートレーニング 和文英訳編",
    publisher: "桐原書店",
    subject: "english",
    level: "standard",
    forGrades: ["h3", "ronin"],
    description:
      "66の文法ポイント＋220例文で英作文の基礎を構築。丁寧な解説で初学者から使える。国公立文系の英作文対策入門に。",
    tags: ["英作文"],
  },
  {
    id: "tb-eng-dragon-english",
    name: "ドラゴンイングリッシュ 基本英文100",
    publisher: "講談社",
    subject: "english",
    level: "standard",
    forGrades: ["h3", "ronin"],
    description:
      "竹岡広信が厳選した100例文を暗記して英作文の型を習得。短期間で完成。センター〜中堅難関大対応。",
    tags: ["英作文"],
  },
  {
    id: "tb-eng-zkai-eisakubun",
    name: "英作文のトレーニング 実践編（Z会）",
    publisher: "Z会",
    subject: "english",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "問題集・参考書・例文集の3役を担う英作文総合書。自由英作文まで対応。難関国公立の英語論述対策に最適。",
    tags: ["英作文", "難関大"],
  },

  // ================================================================
  // 英語 — リスニング
  // ================================================================

  {
    id: "tb-eng-the-listening",
    name: "関正生のThe Listening（英語リスニング）",
    publisher: "旺文社",
    subject: "english",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "共通テスト形式のリスニング対策。聞き取りのルールを整理しながら演習。QRコードで音声再生。",
    tags: ["リスニング", "共通テスト"],
  },

  // ================================================================
  // 英語 — 過去問
  // ================================================================

  {
    id: "tb-eng-toudai-eigo25",
    name: "東大の英語25カ年",
    publisher: "教学社",
    subject: "english",
    level: "top",
    forGrades: ["h3", "ronin"],
    description:
      "東大25年分の英語入試問題を収録した赤本。詳細解説付。最難関対策の最終仕上げに。",
    tags: ["過去問", "最難関"],
  },

  // ================================================================
  // 国語 — 現代文
  // ================================================================

  {
    id: "tb-jp-genbun-access-kihon",
    name: "入試現代文へのアクセス 基本編",
    publisher: "河合出版",
    subject: "japanese",
    level: "basic",
    forGrades: ["h2", "h3"],
    description:
      "現代文の解き方がわからない受験生の入門書。例題4題＋練習12題の16問収録。解法の型を体系的に習得。",
    tags: ["現代文", "基礎"],
  },
  {
    id: "tb-jp-genbun-access-hatten",
    name: "入試現代文へのアクセス 発展編",
    publisher: "河合出版",
    subject: "japanese",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "基本編修了後の発展演習。MARCH〜難関国公立対応レベルの文章で読解力を強化。",
    tags: ["現代文"],
  },
  {
    id: "tb-jp-genbun-access-kansei",
    name: "入試現代文へのアクセス 完成編",
    publisher: "河合出版",
    subject: "japanese",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "難関大の実際の入試問題を使った最終演習。早慶・旧帝大レベルの記述問題まで対応。",
    tags: ["現代文", "難関大"],
  },
  {
    id: "tb-jp-genbun-kakutou",
    name: "現代文と格闘する",
    publisher: "河合出版",
    subject: "japanese",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "早慶・旧帝大対応の難関現代文問題集。傍線・斜線で長文を読み進める手法を習得。要約トレーニングが中心。",
    tags: ["現代文", "難関大"],
  },
  {
    id: "tb-jp-genbun-tokuten",
    name: "得点奪取 現代文",
    publisher: "河合出版",
    subject: "japanese",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "記述・論述問題に特化した難関大対策書。国公立二次の記述答案の書き方を丁寧に解説。",
    tags: ["現代文", "難関大"],
  },
  {
    id: "tb-jp-genbun-dokkai-kaihatsu",
    name: "現代文読解力の開発講座",
    publisher: "駿台文庫",
    subject: "japanese",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "難解な評論文を読み解く論理的思考を養成。段落分けと論理構造の把握を重視した駿台系教材。",
    tags: ["現代文", "難関大"],
  },
  {
    id: "tb-jp-genbun-funakuchi",
    name: "船口の現代文 読と解のストラテジー",
    publisher: "代々木ライブラリー",
    subject: "japanese",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "読解の「戦略」を軸に現代文の解法を体系化。MARCH〜難関大レベルに対応した入試現代文の思考法書。",
    tags: ["現代文"],
  },

  // ================================================================
  // 国語 — 古文
  // ================================================================

  {
    id: "tb-jp-kobun-step",
    name: "ステップアップノート30 古典文法基礎ドリル",
    publisher: "河合出版",
    subject: "japanese",
    level: "basic",
    forGrades: ["h1", "h2"],
    description:
      "古典文法を30テーマで段階的に習得するドリル。活用形・助動詞・敬語を問題演習で定着。",
    tags: ["古文", "文法", "基礎"],
  },
  {
    id: "tb-jp-kobun-tomii-yomi",
    name: "富井の古文読解をはじめからていねいに",
    publisher: "東進ブックス",
    subject: "japanese",
    level: "basic",
    forGrades: ["h1", "h2", "h3"],
    description:
      "古文読解の入門書。文法の知識を「読む」技術に変換するプロセスを丁寧に解説。初学者でも取り組める。",
    tags: ["古文", "読解", "基礎"],
  },
  {
    id: "tb-jp-kobun-madonna",
    name: "マドンナ古文（古文常識と読解の融合）",
    publisher: "Gakken",
    subject: "japanese",
    level: "basic",
    forGrades: ["h2", "h3"],
    description:
      "古文の時代背景・常識と読解を同時に学べる定番。女性向けといわれるが誰でも使いやすい入門書。",
    tags: ["古文", "読解", "古文常識"],
  },
  {
    id: "tb-jp-kobun-tango-gorogo",
    name: "古文単語ゴロゴ",
    publisher: "スタディカンパニー",
    subject: "japanese",
    level: "basic",
    forGrades: ["h1", "h2", "h3", "ronin"],
    description:
      "語呂合わせで古文単語565語を暗記。視覚的なイラスト付でとっつきやすい。短期間で基本単語を網羅。",
    tags: ["古文", "単語"],
  },
  {
    id: "tb-jp-kobun-tango-315",
    name: "読んで見て覚える 重要古文単語315",
    publisher: "桐原書店",
    subject: "japanese",
    level: "basic",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "イラスト・例文で315語を覚える基礎単語帳。MARCH水準まで対応。マドンナ古文と相性が良い。",
    tags: ["古文", "単語", "基礎"],
  },
  {
    id: "tb-jp-kobun-tango-formula600",
    name: "古文単語 FORMULA600",
    publisher: "東進ブックス",
    subject: "japanese",
    level: "advanced",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "600語収録の最大規模古文単語帳。英単語帳のようなシンプルレイアウトでテンポよく反復。早稲田・上智レベルまで対応。",
    tags: ["古文", "単語", "難関大"],
  },
  {
    id: "tb-jp-kobun-jodatsu-kiso",
    name: "古文上達 基礎編 読解と演習45",
    publisher: "Z会",
    subject: "japanese",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "45題の読解演習で古文を得意化。文法解説と問題演習が交互に出てくる構成。MARCH〜中堅国公立対応。",
    tags: ["古文", "演習"],
  },
  {
    id: "tb-jp-kobun-jodatsu-jissen",
    name: "古文上達 読解と演習56",
    publisher: "Z会",
    subject: "japanese",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "基礎編の続き。難関大学の実際の入試問題を使った56題演習。早慶・旧帝大レベルの記述問題まで収録。",
    tags: ["古文", "演習", "難関大"],
  },
  {
    id: "tb-jp-kobun-tokuten",
    name: "得点奪取 古文（記述対策）",
    publisher: "河合出版",
    subject: "japanese",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "国公立二次の古文記述対策。答案の書き方・採点基準を分析した記述特化型問題集。",
    tags: ["古文", "難関大"],
  },

  // ================================================================
  // 国語 — 漢文
  // ================================================================

  {
    id: "tb-jp-kanbun-soku",
    name: "漢文早覚え速答法",
    publisher: "学研プラス",
    subject: "japanese",
    level: "basic",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "頻出漢文句法を10原則でまとめた薄めの参考書。共通テスト対策に特化。1〜2週間で漢文の基礎を完成。",
    tags: ["漢文", "基礎", "薄め"],
  },
  {
    id: "tb-jp-kanbun-step",
    name: "ステップアップノート10 漢文句法",
    publisher: "河合出版",
    subject: "japanese",
    level: "basic",
    forGrades: ["h2", "h3"],
    description:
      "漢文句法を10テーマで段階演習するドリル。句法の確認問題を繰り返して定着。古典文法ドリルの漢文版。",
    tags: ["漢文", "文法", "基礎"],
  },
  {
    id: "tb-jp-kanbun-dojo",
    name: "漢文道場（入門から実戦）",
    publisher: "Z会",
    subject: "japanese",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "基礎句法から入試問題演習まで1冊で網羅。MARCH〜難関国公立の漢文に対応。解説が充実している総合書。",
    tags: ["漢文"],
  },

  // ================================================================
  // 物理
  // ================================================================

  {
    id: "tb-phy-essence",
    name: "物理のエッセンス（力学・波動 / 熱・電磁気・原子）",
    publisher: "河合出版",
    subject: "science",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "物理の基礎を体系的に固める定番書。現象の「本質」を重視した解説で、公式暗記ではなく理解から入る。良問の風の前提書。",
    tags: ["物理", "基礎"],
  },
  {
    id: "tb-phy-ryomonokaze",
    name: "良問の風 物理（頻出・標準入試問題集）",
    publisher: "河合出版",
    subject: "science",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "148問の入試標準問題集。共通テスト満点〜MARCH/中堅国公立レベル。エッセンス修了後に取り組む演習書。",
    tags: ["物理", "演習"],
  },
  {
    id: "tb-phy-meimonnomori",
    name: "名問の森 物理（力学・熱・波動I / 波動II・電磁気・原子）",
    publisher: "河合出版",
    subject: "science",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "良問の風の発展版。難関国公立・医学部レベルの厳選問題集。物理のエッセンスシリーズの最終到達点。",
    tags: ["物理", "演習", "難関大"],
  },
  {
    id: "tb-phy-jushi",
    name: "物理重要問題集（物理基礎・物理）",
    publisher: "数研出版",
    subject: "science",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "A問題（標準）・B問題（発展）の2段構成。全国入試問題からの厳選で幅広い大学に対応。",
    tags: ["物理", "演習"],
  },
  {
    id: "tb-phy-taiho-note",
    name: "為近の物理 基礎物理演習ノート",
    publisher: "旺文社",
    subject: "science",
    level: "standard",
    forGrades: ["h2", "h3"],
    description:
      "人気講師・為近和彦の授業を再現した物理演習ノート。問題を解く思考過程を重視したアプローチ。",
    tags: ["物理", "演習"],
  },
  {
    id: "tb-phy-urushihara",
    name: "漆原晃の物理基礎・物理が面白いほどわかる本",
    publisher: "KADOKAWA",
    subject: "science",
    level: "basic",
    forGrades: ["h1", "h2", "h3"],
    description:
      "「面白いほど」シリーズの物理版。初学者でも読みやすい口語調で物理の全分野を解説。共通テスト対応。",
    tags: ["物理", "基礎", "講義系"],
  },
  {
    id: "tb-phy-nanmon",
    name: "難問題の系統とその解き方（物理）",
    publisher: "ニュートンプレス",
    subject: "science",
    level: "top",
    forGrades: ["h3", "ronin"],
    description:
      "物理の最難関問題を「系統」で分類した伝説的問題集。東大・京大・医学部の本番レベルに対応。難解だが解説が極めて詳しい。",
    tags: ["物理", "最難関"],
  },
  {
    id: "tb-phy-taikei",
    name: "体系物理（大学入試）",
    publisher: "教学社",
    subject: "science",
    level: "advanced",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "基礎から難関大レベルまで体系的に扱う総合物理問題集。解説が詳しく独学向き。",
    tags: ["物理", "演習"],
  },

  // ================================================================
  // 化学
  // ================================================================

  {
    id: "tb-chem-shinkenkyu",
    name: "化学の新研究",
    publisher: "三省堂",
    subject: "science",
    level: "advanced",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "化学の辞書的参考書。理論・無機・有機すべて網羅し、背景知識まで詳説。問題を解いていて疑問が生じたときに参照する。",
    tags: ["化学", "参考書"],
  },
  {
    id: "tb-chem-seminar",
    name: "セミナー化学（基礎問題〜発展問題）",
    publisher: "第一学習社",
    subject: "science",
    level: "standard",
    forGrades: ["h1", "h2", "h3", "ronin"],
    description:
      "学校採用が多い化学の定番問題集。基礎問→プロセス→ドリル→基本例題→発展例題の段階構成。共通テスト〜中堅大対応。",
    tags: ["化学", "演習"],
  },
  {
    id: "tb-chem-kamata-riron",
    name: "鎌田の理論化学の講義（DOシリーズ）",
    publisher: "旺文社",
    subject: "science",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "授業書き起こし風の読みやすい理論化学講義書。新課程三訂版対応。福間の無機・鎌田の有機と3点セットで使う。",
    tags: ["化学", "講義系", "基礎"],
  },
  {
    id: "tb-chem-fukuma-muki",
    name: "福間の無機化学の講義（DOシリーズ）",
    publisher: "旺文社",
    subject: "science",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "無機化学専門の講義書。覚えにくい無機の知識を理由と一緒に整理。新課程五訂版対応。",
    tags: ["化学", "講義系"],
  },
  {
    id: "tb-chem-kamata-yuki",
    name: "鎌田の有機化学の講義（DOシリーズ）",
    publisher: "旺文社",
    subject: "science",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "有機化学の構造決定を中心に解説。複雑な有機反応の流れを体系的に整理。新課程五訂版対応。",
    tags: ["化学", "講義系"],
  },
  {
    id: "tb-chem-jushi",
    name: "化学重要問題集（化学基礎・化学）",
    publisher: "数研出版",
    subject: "science",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "全国の化学入試問題を網羅したA（標準）・B（発展）問題集。難関大二次対策の定番。解説が充実。",
    tags: ["化学", "演習"],
  },
  {
    id: "tb-chem-standard-seiko",
    name: "化学 標準問題精講",
    publisher: "旺文社",
    subject: "science",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "難関大向け化学演習書。精講欄の解説が詳しく、典型問題を深く理解して解く訓練ができる。",
    tags: ["化学", "演習", "難関大"],
  },
  {
    id: "tb-chem-riko-100",
    name: "新理系の化学問題100選",
    publisher: "駿台文庫",
    subject: "science",
    level: "top",
    forGrades: ["h3", "ronin"],
    description:
      "東大・京大・旧帝医学部レベルの化学超難問100問。他の問題集を終えた後の最終仕上げに。解説が極めて詳しい。",
    tags: ["化学", "最難関"],
  },

  // ================================================================
  // 生物
  // ================================================================

  {
    id: "tb-bio-omori-117",
    name: "大森徹の最強講義117講 生物（生物基礎・生物）",
    publisher: "文英堂",
    subject: "science",
    level: "advanced",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "800ページに及ぶ生物の教科書兼参考書。全範囲を余すところなく解説し、難関大の実験考察問題まで対応。辞書的用途にも。",
    tags: ["生物", "講義系"],
  },
  {
    id: "tb-bio-omori-mondai",
    name: "大森徹の最強問題集159問 生物",
    publisher: "文英堂",
    subject: "science",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "最強講義117講の姉妹問題集。医学部・難関国公立で出る実験考察問題を重点演習。記述・論述形式が多い。",
    tags: ["生物", "演習", "難関大"],
  },
  {
    id: "tb-bio-kiso-seiko",
    name: "生物基礎問題精講",
    publisher: "旺文社",
    subject: "science",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "MARCH理系〜私立医学部レベルの頻出問題を精選。精講欄の解説で考え方を理解し暗記に走らない演習ができる。",
    tags: ["生物", "演習"],
  },
  {
    id: "tb-bio-standard-seiko",
    name: "生物 標準問題精講",
    publisher: "旺文社",
    subject: "science",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "難関国公立・医学部向けの生物演習書。論述問題を含む入試上位レベルの問題を精選。",
    tags: ["生物", "演習", "難関大"],
  },
  {
    id: "tb-bio-jushi",
    name: "生物重要問題集（生物基礎・生物）",
    publisher: "数研出版",
    subject: "science",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "A・B問題で段階的演習。全国入試問題から厳選。化学・物理の重問と並ぶ生物版の定番問題集。",
    tags: ["生物", "演習"],
  },
  {
    id: "tb-bio-tanbe-kiso",
    name: "田部の生物基礎をはじめからていねいに",
    publisher: "東進ブックス",
    subject: "science",
    level: "basic",
    forGrades: ["h1", "h2"],
    description:
      "生物基礎の入門書。田部眞哉によるわかりやすい解説で生物基礎の全範囲を網羅。共通テスト生物基礎対策に最適。",
    tags: ["生物", "基礎", "講義系"],
  },

  // ================================================================
  // 社会 — 日本史
  // ================================================================

  {
    id: "tb-soc-yamakawa-jp",
    name: "詳説日本史探究（山川出版）",
    publisher: "山川出版社",
    subject: "social",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "日本史の教科書決定版。歴史的事件の流れ・背景・因果関係を丁寧に解説。共通テスト〜難関大の基礎として必読。",
    tags: ["日本史", "教科書"],
  },
  {
    id: "tb-soc-jikkyou-nihonshi",
    name: "石川の日本史B講義の実況中継（全4冊）",
    publisher: "語学春秋社",
    subject: "social",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "河合塾講師・石川晶康の授業を文字起こし。4冊完成でMARCH〜早慶・国立二次レベルの本格対策が可能。読み物として通史を把握。",
    tags: ["日本史", "講義系"],
  },
  {
    id: "tb-soc-kanaya-jp",
    name: "金谷の日本史「なぜと流れ」がわかる本",
    publisher: "Gakken",
    subject: "social",
    level: "basic",
    forGrades: ["h2", "h3"],
    description:
      "図・フローチャートで歴史の論理関係を視覚化。初学者でも歴史の因果関係がつかみやすい入門書。石川実況中継の前段階として使う。",
    tags: ["日本史", "基礎"],
  },
  {
    id: "tb-soc-toshin-jp-ichimone",
    name: "日本史B 一問一答【完全版】（東進）",
    publisher: "東進ブックス",
    subject: "social",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "6720題収録の大容量一問一答。共通テストから東大レベルまでカバー。用語の定着確認に毎日使う反復ツール。",
    tags: ["日本史", "暗記"],
  },
  {
    id: "tb-soc-jp-standard-seiko",
    name: "日本史 標準問題精講",
    publisher: "旺文社",
    subject: "social",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "難関大向けの日本史問題集。論述・記述問題を含む入試本番レベルの演習。早慶・旧帝大志望の演習に。",
    tags: ["日本史", "難関大"],
  },
  {
    id: "tb-soc-yasashii-jp",
    name: "教科書よりやさしい日本史",
    publisher: "旺文社",
    subject: "social",
    level: "basic",
    forGrades: ["h1", "h2"],
    description:
      "中学〜高校日本史の接続に最適な易しい通史参考書。イラスト豊富でとっつきやすい入門書。",
    tags: ["日本史", "基礎"],
  },

  // ================================================================
  // 社会 — 世界史
  // ================================================================

  {
    id: "tb-soc-yamakawa-world",
    name: "詳説世界史探究（山川出版）",
    publisher: "山川出版社",
    subject: "social",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "世界史の教科書決定版。難関大の入試問題の8割以上がこの教科書の記述から出題される。精読が重要。",
    tags: ["世界史", "教科書"],
  },
  {
    id: "tb-soc-navigator-world",
    name: "ナビゲーター世界史B（全4冊）",
    publisher: "山川出版社",
    subject: "social",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "4冊完成で早慶以上の最難関まで対応できるインプット書。アウトプット問題付き。通史を一通り学んだ後の精読に。",
    tags: ["世界史", "講義系"],
  },
  {
    id: "tb-soc-aoki-world",
    name: "青木裕司 世界史B講義の実況中継（全4冊）",
    publisher: "語学春秋社",
    subject: "social",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "授業を文字起こしした読みやすい講義書。世界史の概要を初学者がつかむのに最適。4冊で通史を完全カバー。",
    tags: ["世界史", "講義系"],
  },
  {
    id: "tb-soc-toshin-world-ichimone",
    name: "世界史B 一問一答【完全版】4th edition（東進）",
    publisher: "東進ブックス",
    subject: "social",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "東大レベルのマイナー用語まで対応した網羅型一問一答。他の一問一答より掲載用語量が多い。通史と並行して使う。",
    tags: ["世界史", "暗記"],
  },
  {
    id: "tb-soc-world-standard-seiko",
    name: "世界史 標準問題精講",
    publisher: "旺文社",
    subject: "social",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "難関大の世界史演習書。論述・記述対応。早慶・国公立二次の世界史で高得点を狙う受験生向け。",
    tags: ["世界史", "難関大"],
  },

  // ================================================================
  // 社会 — 地理
  // ================================================================

  {
    id: "tb-soc-murase-geo-keitou",
    name: "村瀬のゼロからわかる地理B 系統地理編",
    publisher: "Gakken",
    subject: "social",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "イラスト豊富でゼロから地理を学べる入門書。気候・農業・工業などの系統地理を視覚的に理解。共通テスト〜中堅大対応。",
    tags: ["地理", "基礎"],
  },
  {
    id: "tb-soc-murase-geo-chishi",
    name: "村瀬のゼロからわかる地理B 地誌編",
    publisher: "Gakken",
    subject: "social",
    level: "standard",
    forGrades: ["h2", "h3", "ronin"],
    description:
      "アジア・アフリカ・ヨーロッパなど地域別の地誌を解説。系統地理編で学んだ知識が地誌で確認できる構成。",
    tags: ["地理"],
  },
  {
    id: "tb-soc-segawa-geo",
    name: "瀬川の地理B 超重要問題の解き方（系統地理・地誌）",
    publisher: "旺文社",
    subject: "social",
    level: "standard",
    forGrades: ["h3", "ronin"],
    description:
      "地理の問題演習書。入試頻出の問題パターンを類型化して解き方を習得。MARCH〜難関国公立対応。",
    tags: ["地理", "演習"],
  },
  {
    id: "tb-soc-geo-jushi",
    name: "地理 重要問題集",
    publisher: "数研出版",
    subject: "social",
    level: "advanced",
    forGrades: ["h3", "ronin"],
    description:
      "全国の地理入試問題からA・B問題で段階演習。記述・論述問題まで網羅。難関国公立の地理二次対策に。",
    tags: ["地理", "演習", "難関大"],
  },

  // ================================================================
  // 社会 — 公民
  // ================================================================

  {
    id: "tb-soc-kageyama-seikei",
    name: "蔭山の共通テスト 政治・経済",
    publisher: "Gakken",
    subject: "social",
    level: "standard",
    forGrades: ["h3", "ronin"],
    description:
      "共通テスト政治経済に特化した参考書。わかりやすい解説で現代の政治・経済の全範囲を網羅。短期対策に最適。",
    tags: ["政治経済", "共通テスト"],
  },
  {
    id: "tb-soc-kageyama-rinri",
    name: "蔭山の共通テスト 倫理",
    publisher: "Gakken",
    subject: "social",
    level: "standard",
    forGrades: ["h3", "ronin"],
    description:
      "共通テスト倫理に特化。各思想家の考え方を体系的に整理し、図・表で視覚化。共通テストのみで倫理を使う受験生に。",
    tags: ["倫理", "共通テスト"],
  },
  {
    id: "tb-soc-hatakeyama-seikei",
    name: "畠山のスパッとわかる 政治・経済 爽快講義",
    publisher: "栄光",
    subject: "social",
    level: "standard",
    forGrades: ["h3", "ronin"],
    description:
      "政経の決定版講義書。法律・経済の仕組みを生動きのある解説でわかりやすく解説。MARCH〜難関大の政経に対応。",
    tags: ["政治経済"],
  },

  // ================================================================
  // 過去問（代表的な赤本シリーズ）
  // ================================================================

  {
    id: "tb-past-toudai",
    name: "東京大学 前期（赤本）",
    publisher: "教学社",
    subject: "math",
    level: "top",
    forGrades: ["h3", "ronin"],
    description:
      "東京大学の実際の入試問題25〜27カ年分を収録。詳細解説付き。最終仕上げに必須の過去問。",
    tags: ["過去問", "最難関"],
  },
  {
    id: "tb-past-kyodai",
    name: "京都大学 前期（赤本）",
    publisher: "教学社",
    subject: "math",
    level: "top",
    forGrades: ["h3", "ronin"],
    description:
      "京都大学の過去問25カ年分。記述・論述問題が多い京大の傾向分析と解答例付き。",
    tags: ["過去問", "最難関"],
  },
  {
    id: "tb-past-kyotsute-kawai",
    name: "共通テスト過去問・予想問題集（全科目）河合塾版",
    publisher: "河合出版",
    subject: "math",
    level: "standard",
    forGrades: ["h3", "ronin"],
    description:
      "共通テストの本試験過去問＋河合塾作成予想問題を収録。黒本として親しまれる。科目ごとに分冊。",
    tags: ["過去問", "共通テスト"],
  },
  {
    id: "tb-past-kyotsute-sundai",
    name: "共通テスト過去問・予想問題集（全科目）駿台版",
    publisher: "駿台文庫",
    subject: "math",
    level: "standard",
    forGrades: ["h3", "ronin"],
    description:
      "共通テストの本試験過去問＋駿台予想問題を収録。青本として親しまれる。難度高めの予想問題が特徴。",
    tags: ["過去問", "共通テスト"],
  },
  {
    id: "tb-past-kyotsute-zkai",
    name: "共通テスト過去問・予想問題集（全科目）Z会版",
    publisher: "Z会",
    subject: "math",
    level: "standard",
    forGrades: ["h3", "ronin"],
    description:
      "本試験過去問＋Z会予想問題収録。思考力を問う問題の解説が詳しい。難関大志望にも対応できる問題レベル。",
    tags: ["過去問", "共通テスト"],
  },
];

export const TEXTBOOK_TAGS = [
  "網羅系",
  "基礎",
  "演習",
  "難関大",
  "最難関",
  "単語",
  "熟語",
  "文法",
  "長文",
  "読解",
  "解釈",
  "英作文",
  "リスニング",
  "講義系",
  "参考書",
  "古文",
  "漢文",
  "現代文",
  "古文常識",
  "物理",
  "化学",
  "生物",
  "日本史",
  "世界史",
  "地理",
  "政治経済",
  "倫理",
  "1対1",
  "過去問",
  "共通テスト",
  "旧帝大",
  "薄め",
  "暗記",
  "教科書",
] as const;

export function searchTextbooks(query: string): Textbook[] {
  const q = query.trim().toLowerCase();
  if (!q) return TEXTBOOKS;
  return TEXTBOOKS.filter((t) => {
    const haystack =
      `${t.name} ${t.publisher} ${t.description} ${t.tags.join(" ")}`.toLowerCase();
    return haystack.includes(q);
  });
}
