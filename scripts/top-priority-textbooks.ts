// 受験生が使う頻度の高い順 (≒ 発行部数 + 武田塾ルート + 東進ブックス + StudyPlus 登録数)
// Phase B (AI 深掘り) でメタデータ充実化する対象。
// title + publisher で NDL/openBD から ISBN を引いて、bulk DB と紐付ける。

export type PriorityTextbook = {
  rank: number;            // 1=最重要
  title: string;
  publisher: string;
  subject: "math" | "english" | "japanese" | "science" | "social";
  detailSubject?: string;  // "math-1a" / "eng-vocab" など
  level: "foundation" | "basic" | "standard" | "advanced" | "top";
  series?: string;
  notes?: string;          // キュレーションメモ
};

export const TOP_PRIORITY: PriorityTextbook[] = [
  // ====== 数学 (40 冊) ======
  { rank: 1, title: "チャート式 基礎からの数学Ⅰ+A", publisher: "数研出版", subject: "math", detailSubject: "math-1a", level: "standard", series: "青チャート" },
  { rank: 2, title: "チャート式 基礎からの数学Ⅱ+B", publisher: "数研出版", subject: "math", detailSubject: "math-2b", level: "standard", series: "青チャート" },
  { rank: 3, title: "チャート式 基礎からの数学Ⅲ+C", publisher: "数研出版", subject: "math", detailSubject: "math-3c", level: "advanced", series: "青チャート" },
  { rank: 4, title: "Focus Gold 数学Ⅰ+A", publisher: "啓林館", subject: "math", detailSubject: "math-1a", level: "advanced", series: "Focus Gold" },
  { rank: 5, title: "Focus Gold 数学Ⅱ+B", publisher: "啓林館", subject: "math", detailSubject: "math-2b", level: "advanced", series: "Focus Gold" },
  { rank: 6, title: "Focus Gold 数学Ⅲ", publisher: "啓林館", subject: "math", detailSubject: "math-3", level: "advanced", series: "Focus Gold" },
  { rank: 7, title: "数学Ⅰ・A 基礎問題精講", publisher: "旺文社", subject: "math", detailSubject: "math-1a", level: "basic", series: "基礎問題精講" },
  { rank: 8, title: "数学Ⅱ・B 基礎問題精講", publisher: "旺文社", subject: "math", detailSubject: "math-2b", level: "basic", series: "基礎問題精講" },
  { rank: 9, title: "数学Ⅲ 基礎問題精講", publisher: "旺文社", subject: "math", detailSubject: "math-3", level: "basic", series: "基礎問題精講" },
  { rank: 10, title: "1対1対応の演習 数学Ⅰ", publisher: "東京出版", subject: "math", detailSubject: "math-1", level: "advanced", series: "1対1対応" },
  { rank: 11, title: "1対1対応の演習 数学A", publisher: "東京出版", subject: "math", detailSubject: "math-a", level: "advanced", series: "1対1対応" },
  { rank: 12, title: "1対1対応の演習 数学Ⅱ", publisher: "東京出版", subject: "math", detailSubject: "math-2", level: "advanced", series: "1対1対応" },
  { rank: 13, title: "1対1対応の演習 数学B", publisher: "東京出版", subject: "math", detailSubject: "math-b", level: "advanced", series: "1対1対応" },
  { rank: 14, title: "1対1対応の演習 数学Ⅲ", publisher: "東京出版", subject: "math", detailSubject: "math-3", level: "advanced", series: "1対1対応" },
  { rank: 15, title: "数学Ⅰ・A 標準問題精講", publisher: "旺文社", subject: "math", detailSubject: "math-1a", level: "advanced", series: "標準問題精講" },
  { rank: 16, title: "数学Ⅱ・B 標準問題精講", publisher: "旺文社", subject: "math", detailSubject: "math-2b", level: "advanced", series: "標準問題精講" },
  { rank: 17, title: "数学Ⅲ 標準問題精講", publisher: "旺文社", subject: "math", detailSubject: "math-3", level: "advanced", series: "標準問題精講" },
  { rank: 18, title: "数学重要問題集 数学Ⅰ・Ⅱ・A・B 理系", publisher: "数研出版", subject: "math", level: "standard", series: "重要問題集" },
  { rank: 19, title: "数学重要問題集 数学Ⅰ・Ⅱ・A・B 文系", publisher: "数研出版", subject: "math", level: "standard", series: "重要問題集" },
  { rank: 20, title: "やさしい理系数学", publisher: "河合出版", subject: "math", level: "top", notes: "タイトルに反して難しい" },
  { rank: 21, title: "ハイレベル理系数学", publisher: "河合出版", subject: "math", level: "top" },
  { rank: 22, title: "文系数学の良問プラチカ", publisher: "河合出版", subject: "math", level: "advanced", series: "プラチカ" },
  { rank: 23, title: "理系数学の良問プラチカ 数学Ⅰ・A・Ⅱ・B", publisher: "河合出版", subject: "math", level: "advanced", series: "プラチカ" },
  { rank: 24, title: "理系数学の良問プラチカ 数学Ⅲ", publisher: "河合出版", subject: "math", level: "advanced", series: "プラチカ" },
  { rank: 25, title: "新数学スタンダード演習", publisher: "東京出版", subject: "math", level: "top" },
  { rank: 26, title: "数学Ⅲ スタンダード演習", publisher: "東京出版", subject: "math", level: "top" },
  { rank: 27, title: "マスター・オブ・整数", publisher: "東京出版", subject: "math", level: "top" },
  { rank: 28, title: "マスター・オブ・場合の数", publisher: "東京出版", subject: "math", level: "top" },
  { rank: 29, title: "上級問題精講 数学Ⅰ・Ⅱ・A・B", publisher: "旺文社", subject: "math", level: "top", series: "上級問題精講" },
  { rank: 30, title: "上級問題精講 数学Ⅲ", publisher: "旺文社", subject: "math", level: "top", series: "上級問題精講" },
  { rank: 31, title: "ハイレベル数学Ⅰ・A・Ⅱ・Bの完全攻略", publisher: "駿台文庫", subject: "math", level: "top" },
  { rank: 32, title: "ハイレベル数学Ⅲの完全攻略", publisher: "駿台文庫", subject: "math", level: "top" },
  { rank: 33, title: "入門問題精講 数学Ⅰ・A", publisher: "旺文社", subject: "math", detailSubject: "math-1a", level: "foundation" },
  { rank: 34, title: "入門問題精講 数学Ⅱ・B", publisher: "旺文社", subject: "math", detailSubject: "math-2b", level: "foundation" },
  { rank: 35, title: "白チャート 数学Ⅰ+A", publisher: "数研出版", subject: "math", detailSubject: "math-1a", level: "foundation", series: "白チャート" },
  { rank: 36, title: "黄チャート 数学Ⅰ+A", publisher: "数研出版", subject: "math", detailSubject: "math-1a", level: "basic", series: "黄チャート" },
  { rank: 37, title: "赤チャート 数学Ⅰ+A", publisher: "数研出版", subject: "math", detailSubject: "math-1a", level: "top", series: "赤チャート" },
  { rank: 38, title: "大学への数学 数学Ⅰ・A・Ⅱ・B 解法の探求", publisher: "東京出版", subject: "math", level: "top" },
  { rank: 39, title: "数学の真髄 ―基本原理追求編―", publisher: "学研プラス", subject: "math", level: "advanced" },
  { rank: 40, title: "合格る計算 数学Ⅰ・A・Ⅱ・B", publisher: "文英堂", subject: "math", level: "basic" },

  // ====== 英語 単語 (15 冊) ======
  { rank: 41, title: "システム英単語", publisher: "駿台文庫", subject: "english", detailSubject: "eng-vocab", level: "standard", notes: "通称シス単。大学受験定番No.1" },
  { rank: 42, title: "英単語ターゲット1900", publisher: "旺文社", subject: "english", detailSubject: "eng-vocab", level: "standard", series: "ターゲット" },
  { rank: 43, title: "英単語ターゲット1400", publisher: "旺文社", subject: "english", detailSubject: "eng-vocab", level: "basic", series: "ターゲット" },
  { rank: 44, title: "英単語ターゲット1200", publisher: "旺文社", subject: "english", detailSubject: "eng-vocab", level: "foundation", series: "ターゲット" },
  { rank: 45, title: "DUO 3.0", publisher: "アイシーピー", subject: "english", detailSubject: "eng-vocab", level: "standard" },
  { rank: 46, title: "鉄緑会東大英単語熟語 鉄壁", publisher: "KADOKAWA", subject: "english", detailSubject: "eng-vocab", level: "top", notes: "通称：鉄壁" },
  { rank: 47, title: "速読英単語 必修編", publisher: "Z会", subject: "english", detailSubject: "eng-vocab", level: "standard", series: "速読英単語" },
  { rank: 48, title: "速読英単語 上級編", publisher: "Z会", subject: "english", detailSubject: "eng-vocab", level: "top", series: "速読英単語" },
  { rank: 49, title: "速読英熟語", publisher: "Z会", subject: "english", detailSubject: "eng-vocab", level: "standard" },
  { rank: 50, title: "解体英熟語", publisher: "Z会", subject: "english", detailSubject: "eng-vocab", level: "advanced" },
  { rank: 51, title: "LEAP", publisher: "数研出版", subject: "english", detailSubject: "eng-vocab", level: "standard" },
  { rank: 52, title: "リンガメタリカ", publisher: "Z会", subject: "english", detailSubject: "eng-vocab", level: "top" },
  { rank: 53, title: "Stock 4500", publisher: "桐原書店", subject: "english", detailSubject: "eng-vocab", level: "standard" },
  { rank: 54, title: "キクタン Advanced 6000", publisher: "アルク", subject: "english", detailSubject: "eng-vocab", level: "advanced" },
  { rank: 55, title: "システム英熟語", publisher: "駿台文庫", subject: "english", detailSubject: "eng-vocab", level: "standard" },

  // ====== 英語 文法 (12 冊) ======
  { rank: 56, title: "Next Stage 英文法・語法問題", publisher: "桐原書店", subject: "english", detailSubject: "eng-grammar", level: "standard", notes: "通称ネクステ" },
  { rank: 57, title: "Vintage 英文法・語法", publisher: "いいずな書店", subject: "english", detailSubject: "eng-grammar", level: "standard" },
  { rank: 58, title: "Scramble 英文法・語法", publisher: "旺文社", subject: "english", detailSubject: "eng-grammar", level: "standard" },
  { rank: 59, title: "頻出英文法・語法問題1000", publisher: "桐原書店", subject: "english", detailSubject: "eng-grammar", level: "advanced" },
  { rank: 60, title: "英文法・語法問題1000", publisher: "桐原書店", subject: "english", detailSubject: "eng-grammar", level: "advanced" },
  { rank: 61, title: "Evergreen", publisher: "いいずな書店", subject: "english", detailSubject: "eng-grammar", level: "standard", notes: "総合英語" },
  { rank: 62, title: "総合英語 Forest", publisher: "桐原書店", subject: "english", detailSubject: "eng-grammar", level: "standard" },
  { rank: 63, title: "大岩のいちばんはじめの英文法", publisher: "東進ブックス", subject: "english", detailSubject: "eng-grammar", level: "foundation" },
  { rank: 64, title: "Power Stage 英文法・語法問題", publisher: "桐原書店", subject: "english", detailSubject: "eng-grammar", level: "advanced" },
  { rank: 65, title: "1億人の英文法", publisher: "東進ブックス", subject: "english", detailSubject: "eng-grammar", level: "standard" },
  { rank: 66, title: "英文法ポラリス1", publisher: "KADOKAWA", subject: "english", detailSubject: "eng-grammar", level: "basic", series: "ポラリス" },
  { rank: 67, title: "英文法ポラリス2", publisher: "KADOKAWA", subject: "english", detailSubject: "eng-grammar", level: "standard", series: "ポラリス" },

  // ====== 英語 読解 (15 冊) ======
  { rank: 68, title: "ポレポレ英文読解プロセス50", publisher: "代々木ライブラリー", subject: "english", detailSubject: "eng-reading", level: "advanced" },
  { rank: 69, title: "英文解釈の技術100", publisher: "桐原書店", subject: "english", detailSubject: "eng-reading", level: "advanced" },
  { rank: 70, title: "基礎英文解釈の技術100", publisher: "桐原書店", subject: "english", detailSubject: "eng-reading", level: "standard" },
  { rank: 71, title: "入門英文解釈の技術70", publisher: "桐原書店", subject: "english", detailSubject: "eng-reading", level: "basic" },
  { rank: 72, title: "英文読解の透視図", publisher: "研究社", subject: "english", detailSubject: "eng-reading", level: "top" },
  { rank: 73, title: "やっておきたい英語長文300", publisher: "河合出版", subject: "english", detailSubject: "eng-reading", level: "basic", series: "やっておきたい" },
  { rank: 74, title: "やっておきたい英語長文500", publisher: "河合出版", subject: "english", detailSubject: "eng-reading", level: "standard", series: "やっておきたい" },
  { rank: 75, title: "やっておきたい英語長文700", publisher: "河合出版", subject: "english", detailSubject: "eng-reading", level: "advanced", series: "やっておきたい" },
  { rank: 76, title: "やっておきたい英語長文1000", publisher: "河合出版", subject: "english", detailSubject: "eng-reading", level: "top", series: "やっておきたい" },
  { rank: 77, title: "関正生のThe Rules 英語長文問題集1", publisher: "旺文社", subject: "english", detailSubject: "eng-reading", level: "foundation", series: "The Rules" },
  { rank: 78, title: "関正生のThe Rules 英語長文問題集2", publisher: "旺文社", subject: "english", detailSubject: "eng-reading", level: "basic", series: "The Rules" },
  { rank: 79, title: "関正生のThe Rules 英語長文問題集3", publisher: "旺文社", subject: "english", detailSubject: "eng-reading", level: "standard", series: "The Rules" },
  { rank: 80, title: "関正生のThe Rules 英語長文問題集4", publisher: "旺文社", subject: "english", detailSubject: "eng-reading", level: "advanced", series: "The Rules" },
  { rank: 81, title: "英語長文ハイパートレーニング レベル1", publisher: "桐原書店", subject: "english", detailSubject: "eng-reading", level: "basic", series: "ハイパートレーニング" },
  { rank: 82, title: "英語長文ハイパートレーニング レベル2", publisher: "桐原書店", subject: "english", detailSubject: "eng-reading", level: "standard", series: "ハイパートレーニング" },

  // ====== 英語 英作文 + リスニング (8 冊) ======
  { rank: 83, title: "大矢復 英作文 ハイパートレーニング 自由英作文編", publisher: "桐原書店", subject: "english", detailSubject: "eng-writing", level: "standard" },
  { rank: 84, title: "大矢復 英作文 ハイパートレーニング 和文英訳編", publisher: "桐原書店", subject: "english", detailSubject: "eng-writing", level: "standard" },
  { rank: 85, title: "ドラゴン・イングリッシュ基本英文100", publisher: "講談社", subject: "english", detailSubject: "eng-writing", level: "advanced" },
  { rank: 86, title: "英作文のトレーニング 入門編", publisher: "Z会", subject: "english", detailSubject: "eng-writing", level: "basic" },
  { rank: 87, title: "英作文のトレーニング 実戦編", publisher: "Z会", subject: "english", detailSubject: "eng-writing", level: "advanced" },
  { rank: 88, title: "関正生のThe Essentials 英語リスニング 必修英文100", publisher: "旺文社", subject: "english", detailSubject: "eng-listening", level: "standard" },
  { rank: 89, title: "灘高キムタツの東大英語リスニング", publisher: "アルク", subject: "english", detailSubject: "eng-listening", level: "top" },
  { rank: 90, title: "共通テスト英語リスニング 全パターン徹底対策", publisher: "学研プラス", subject: "english", detailSubject: "eng-listening", level: "standard" },

  // ====== 国語 現代文 (10 冊) ======
  { rank: 91, title: "入試現代文へのアクセス 基本編", publisher: "河合出版", subject: "japanese", detailSubject: "jp-modern", level: "basic", series: "アクセス" },
  { rank: 92, title: "入試現代文へのアクセス 発展編", publisher: "河合出版", subject: "japanese", detailSubject: "jp-modern", level: "standard", series: "アクセス" },
  { rank: 93, title: "入試現代文へのアクセス 完成編", publisher: "河合出版", subject: "japanese", detailSubject: "jp-modern", level: "advanced", series: "アクセス" },
  { rank: 94, title: "現代文と格闘する", publisher: "河合出版", subject: "japanese", detailSubject: "jp-modern", level: "advanced" },
  { rank: 95, title: "得点奪取 現代文", publisher: "河合出版", subject: "japanese", detailSubject: "jp-modern", level: "advanced" },
  { rank: 96, title: "現代文読解力の開発講座", publisher: "駿台文庫", subject: "japanese", detailSubject: "jp-modern", level: "advanced" },
  { rank: 97, title: "船口のゼロから読み解く最強の現代文", publisher: "学研プラス", subject: "japanese", detailSubject: "jp-modern", level: "basic" },
  { rank: 98, title: "霜栄の現代文 記述問題のオキテ55", publisher: "KADOKAWA", subject: "japanese", detailSubject: "jp-modern", level: "advanced" },
  { rank: 99, title: "現代文単語 ゴロゴ", publisher: "スタディカンパニー", subject: "japanese", detailSubject: "jp-modern", level: "basic" },
  { rank: 100, title: "きめる！共通テスト現代文", publisher: "学研プラス", subject: "japanese", detailSubject: "jp-modern", level: "basic" },

  // ====== 国語 古文 (12 冊) ======
  { rank: 101, title: "ステップアップノート30 古典文法基礎ドリル", publisher: "河合出版", subject: "japanese", detailSubject: "jp-classical", level: "foundation" },
  { rank: 102, title: "富井の古文読解をはじめからていねいに", publisher: "東進ブックス", subject: "japanese", detailSubject: "jp-classical", level: "foundation" },
  { rank: 103, title: "古文 マドンナ古文", publisher: "学研プラス", subject: "japanese", detailSubject: "jp-classical", level: "basic" },
  { rank: 104, title: "マドンナ古文常識217", publisher: "学研プラス", subject: "japanese", detailSubject: "jp-classical", level: "basic" },
  { rank: 105, title: "古文上達 基礎編 読解と演習45", publisher: "Z会", subject: "japanese", detailSubject: "jp-classical", level: "basic" },
  { rank: 106, title: "古文上達 読解と演習56", publisher: "Z会", subject: "japanese", detailSubject: "jp-classical", level: "standard" },
  { rank: 107, title: "得点奪取 古文", publisher: "河合出版", subject: "japanese", detailSubject: "jp-classical", level: "advanced" },
  { rank: 108, title: "古文単語ゴロゴ", publisher: "スタディカンパニー", subject: "japanese", detailSubject: "jp-classical", level: "basic" },
  { rank: 109, title: "古文単語FORMULA600", publisher: "東進ブックス", subject: "japanese", detailSubject: "jp-classical", level: "standard" },
  { rank: 110, title: "読んで見て覚える重要古文単語315", publisher: "桐原書店", subject: "japanese", detailSubject: "jp-classical", level: "standard" },
  { rank: 111, title: "565ゴロ覚え 古文単語", publisher: "アルス工房", subject: "japanese", detailSubject: "jp-classical", level: "basic" },
  { rank: 112, title: "古文文法 ステップアップノート30", publisher: "河合出版", subject: "japanese", detailSubject: "jp-classical", level: "foundation" },

  // ====== 国語 漢文 (5 冊) ======
  { rank: 113, title: "ステップアップノート10 漢文句法・ドリルと演習", publisher: "河合出版", subject: "japanese", detailSubject: "jp-chinese", level: "foundation" },
  { rank: 114, title: "漢文 早覚え速答法", publisher: "学研プラス", subject: "japanese", detailSubject: "jp-chinese", level: "basic" },
  { rank: 115, title: "漢文道場 入門から実戦まで", publisher: "Z会", subject: "japanese", detailSubject: "jp-chinese", level: "standard" },
  { rank: 116, title: "漢文必携 四訂版", publisher: "桐原書店", subject: "japanese", detailSubject: "jp-chinese", level: "basic" },
  { rank: 117, title: "得点奪取 漢文", publisher: "河合出版", subject: "japanese", detailSubject: "jp-chinese", level: "advanced" },

  // ====== 物理 (12 冊) ======
  { rank: 118, title: "物理のエッセンス 力学・波動", publisher: "河合出版", subject: "science", detailSubject: "physics", level: "basic", series: "エッセンス" },
  { rank: 119, title: "物理のエッセンス 電磁気・熱・原子", publisher: "河合出版", subject: "science", detailSubject: "physics", level: "basic", series: "エッセンス" },
  { rank: 120, title: "良問の風 物理", publisher: "河合出版", subject: "science", detailSubject: "physics", level: "standard" },
  { rank: 121, title: "名問の森 物理 力学・熱・波動1", publisher: "河合出版", subject: "science", detailSubject: "physics", level: "advanced" },
  { rank: 122, title: "名問の森 物理 波動2・電磁気・原子", publisher: "河合出版", subject: "science", detailSubject: "physics", level: "advanced" },
  { rank: 123, title: "物理重要問題集", publisher: "数研出版", subject: "science", detailSubject: "physics", level: "advanced" },
  { rank: 124, title: "漆原晃の物理基礎・物理が面白いほどわかる本 力学・熱力学", publisher: "KADOKAWA", subject: "science", detailSubject: "physics", level: "foundation" },
  { rank: 125, title: "漆原晃の物理基礎・物理が面白いほどわかる本 電磁気・波動・原子", publisher: "KADOKAWA", subject: "science", detailSubject: "physics", level: "foundation" },
  { rank: 126, title: "為近の物理基礎＆物理 演習問題集", publisher: "代々木ライブラリー", subject: "science", detailSubject: "physics", level: "standard" },
  { rank: 127, title: "難問題の系統とその解き方 物理", publisher: "ニュートンプレス", subject: "science", detailSubject: "physics", level: "top" },
  { rank: 128, title: "体系物理", publisher: "教学社", subject: "science", detailSubject: "physics", level: "advanced" },
  { rank: 129, title: "物理 標準問題精講", publisher: "旺文社", subject: "science", detailSubject: "physics", level: "advanced" },

  // ====== 化学 (12 冊) ======
  { rank: 130, title: "化学の新研究", publisher: "三省堂", subject: "science", detailSubject: "chemistry", level: "advanced", notes: "辞書的存在" },
  { rank: 131, title: "化学の新演習", publisher: "三省堂", subject: "science", detailSubject: "chemistry", level: "top" },
  { rank: 132, title: "セミナー化学基礎+化学", publisher: "第一学習社", subject: "science", detailSubject: "chemistry", level: "basic" },
  { rank: 133, title: "リードα化学基礎+化学", publisher: "数研出版", subject: "science", detailSubject: "chemistry", level: "basic" },
  { rank: 134, title: "化学重要問題集", publisher: "数研出版", subject: "science", detailSubject: "chemistry", level: "advanced" },
  { rank: 135, title: "化学 標準問題精講", publisher: "旺文社", subject: "science", detailSubject: "chemistry", level: "advanced" },
  { rank: 136, title: "鎌田の理論化学の講義", publisher: "旺文社", subject: "science", detailSubject: "chemistry", level: "basic", series: "DOシリーズ" },
  { rank: 137, title: "鎌田の有機化学の講義", publisher: "旺文社", subject: "science", detailSubject: "chemistry", level: "basic", series: "DOシリーズ" },
  { rank: 138, title: "福間の無機化学の講義", publisher: "旺文社", subject: "science", detailSubject: "chemistry", level: "basic", series: "DOシリーズ" },
  { rank: 139, title: "新理系の化学問題100選", publisher: "駿台文庫", subject: "science", detailSubject: "chemistry", level: "top" },
  { rank: 140, title: "化学基礎問題精講", publisher: "旺文社", subject: "science", detailSubject: "chemistry", level: "basic" },
  { rank: 141, title: "原点からの化学 化学の計算", publisher: "駿台文庫", subject: "science", detailSubject: "chemistry", level: "advanced" },

  // ====== 生物 (8 冊) ======
  { rank: 142, title: "大森徹の最強講義117講 生物", publisher: "文英堂", subject: "science", detailSubject: "biology", level: "standard" },
  { rank: 143, title: "大森徹の最強問題集159問 生物", publisher: "文英堂", subject: "science", detailSubject: "biology", level: "standard" },
  { rank: 144, title: "生物 基礎問題精講", publisher: "旺文社", subject: "science", detailSubject: "biology", level: "basic" },
  { rank: 145, title: "生物 標準問題精講", publisher: "旺文社", subject: "science", detailSubject: "biology", level: "advanced" },
  { rank: 146, title: "生物重要問題集", publisher: "数研出版", subject: "science", detailSubject: "biology", level: "advanced" },
  { rank: 147, title: "田部の生物基礎をはじめからていねいに", publisher: "東進ブックス", subject: "science", detailSubject: "biology", level: "foundation" },
  { rank: 148, title: "田部の生物をはじめからていねいに", publisher: "東進ブックス", subject: "science", detailSubject: "biology", level: "foundation" },
  { rank: 149, title: "実戦 生物 重要問題集", publisher: "数研出版", subject: "science", detailSubject: "biology", level: "advanced" },

  // ====== 日本史 (10 冊) ======
  { rank: 150, title: "詳説日本史B", publisher: "山川出版社", subject: "social", detailSubject: "japanese-history", level: "standard", notes: "教科書" },
  { rank: 151, title: "石川晶康 日本史B 講義の実況中継 1", publisher: "語学春秋社", subject: "social", detailSubject: "japanese-history", level: "standard", series: "実況中継" },
  { rank: 152, title: "石川晶康 日本史B 講義の実況中継 2", publisher: "語学春秋社", subject: "social", detailSubject: "japanese-history", level: "standard", series: "実況中継" },
  { rank: 153, title: "石川晶康 日本史B 講義の実況中継 3", publisher: "語学春秋社", subject: "social", detailSubject: "japanese-history", level: "standard", series: "実況中継" },
  { rank: 154, title: "石川晶康 日本史B 講義の実況中継 4", publisher: "語学春秋社", subject: "social", detailSubject: "japanese-history", level: "standard", series: "実況中継" },
  { rank: 155, title: "日本史B一問一答 完全版", publisher: "東進ブックス", subject: "social", detailSubject: "japanese-history", level: "standard" },
  { rank: 156, title: "日本史 標準問題精講", publisher: "旺文社", subject: "social", detailSubject: "japanese-history", level: "advanced" },
  { rank: 157, title: "金谷の日本史「なぜ」と「流れ」がわかる本 原始・古代史", publisher: "ナガセ", subject: "social", detailSubject: "japanese-history", level: "foundation" },
  { rank: 158, title: "教科書よりやさしい日本史", publisher: "旺文社", subject: "social", detailSubject: "japanese-history", level: "foundation" },
  { rank: 159, title: "山川 詳説日本史B 重要用語チェック", publisher: "山川出版社", subject: "social", detailSubject: "japanese-history", level: "basic" },

  // ====== 世界史 (10 冊) ======
  { rank: 160, title: "詳説世界史B", publisher: "山川出版社", subject: "social", detailSubject: "world-history", level: "standard", notes: "教科書" },
  { rank: 161, title: "ナビゲーター世界史B 1", publisher: "山川出版社", subject: "social", detailSubject: "world-history", level: "standard", series: "ナビゲーター" },
  { rank: 162, title: "ナビゲーター世界史B 2", publisher: "山川出版社", subject: "social", detailSubject: "world-history", level: "standard", series: "ナビゲーター" },
  { rank: 163, title: "ナビゲーター世界史B 3", publisher: "山川出版社", subject: "social", detailSubject: "world-history", level: "standard", series: "ナビゲーター" },
  { rank: 164, title: "ナビゲーター世界史B 4", publisher: "山川出版社", subject: "social", detailSubject: "world-history", level: "standard", series: "ナビゲーター" },
  { rank: 165, title: "世界史B一問一答 完全版", publisher: "東進ブックス", subject: "social", detailSubject: "world-history", level: "standard" },
  { rank: 166, title: "世界史 標準問題精講", publisher: "旺文社", subject: "social", detailSubject: "world-history", level: "advanced" },
  { rank: 167, title: "青木裕司 世界史B 講義の実況中継 1", publisher: "語学春秋社", subject: "social", detailSubject: "world-history", level: "standard", series: "実況中継" },
  { rank: 168, title: "青木裕司 世界史B 講義の実況中継 2", publisher: "語学春秋社", subject: "social", detailSubject: "world-history", level: "standard", series: "実況中継" },
  { rank: 169, title: "山川 詳説世界史B 重要用語チェック", publisher: "山川出版社", subject: "social", detailSubject: "world-history", level: "basic" },

  // ====== 地理 (6 冊) ======
  { rank: 170, title: "村瀬の地理Bをはじめからていねいに 系統地理編", publisher: "ナガセ", subject: "social", detailSubject: "geography", level: "foundation" },
  { rank: 171, title: "村瀬の地理Bをはじめからていねいに 地誌編", publisher: "ナガセ", subject: "social", detailSubject: "geography", level: "foundation" },
  { rank: 172, title: "瀬川聡の 地理B 講義の実況中継 1", publisher: "語学春秋社", subject: "social", detailSubject: "geography", level: "standard", series: "実況中継" },
  { rank: 173, title: "瀬川聡の 地理B 講義の実況中継 2", publisher: "語学春秋社", subject: "social", detailSubject: "geography", level: "standard", series: "実況中継" },
  { rank: 174, title: "地理B 一問一答", publisher: "東進ブックス", subject: "social", detailSubject: "geography", level: "standard" },
  { rank: 175, title: "山岡の地理B教室", publisher: "東進ブックス", subject: "social", detailSubject: "geography", level: "basic" },

  // ====== 公民 (6 冊) ======
  { rank: 176, title: "蔭山の共通テスト政治・経済", publisher: "学研プラス", subject: "social", detailSubject: "civics-politics", level: "basic" },
  { rank: 177, title: "蔭山の共通テスト倫理", publisher: "学研プラス", subject: "social", detailSubject: "civics-ethics", level: "basic" },
  { rank: 178, title: "畠山のスパッとわかる政治・経済 爽快講義", publisher: "栄光", subject: "social", detailSubject: "civics-politics", level: "standard" },
  { rank: 179, title: "政治・経済 標準問題精講", publisher: "旺文社", subject: "social", detailSubject: "civics-politics", level: "advanced" },
  { rank: 180, title: "倫理、政治・経済の点数が面白いほどとれる本", publisher: "KADOKAWA", subject: "social", detailSubject: "civics-ethics", level: "basic" },
  { rank: 181, title: "用語集 政治・経済 新訂第3版", publisher: "清水書院", subject: "social", detailSubject: "civics-politics", level: "standard" },

  // ====== 共通テスト/赤本 (各科目代表) (10 冊) ======
  { rank: 182, title: "共通テスト過去問研究 数学Ⅰ・A／Ⅱ・B", publisher: "教学社", subject: "math", level: "standard", series: "赤本" },
  { rank: 183, title: "共通テスト過去問研究 英語", publisher: "教学社", subject: "english", level: "standard", series: "赤本" },
  { rank: 184, title: "共通テスト過去問研究 国語", publisher: "教学社", subject: "japanese", level: "standard", series: "赤本" },
  { rank: 185, title: "共通テスト過去問研究 物理／物理基礎", publisher: "教学社", subject: "science", level: "standard", series: "赤本" },
  { rank: 186, title: "共通テスト過去問研究 化学／化学基礎", publisher: "教学社", subject: "science", level: "standard", series: "赤本" },
  { rank: 187, title: "共通テスト過去問研究 生物／生物基礎", publisher: "教学社", subject: "science", level: "standard", series: "赤本" },
  { rank: 188, title: "共通テスト過去問研究 日本史B", publisher: "教学社", subject: "social", level: "standard", series: "赤本" },
  { rank: 189, title: "共通テスト過去問研究 世界史B", publisher: "教学社", subject: "social", level: "standard", series: "赤本" },
  { rank: 190, title: "共通テスト過去問研究 政治・経済", publisher: "教学社", subject: "social", level: "standard", series: "赤本" },
  { rank: 191, title: "共通テスト過去問研究 地理B", publisher: "教学社", subject: "social", level: "standard", series: "赤本" },

  // ====== 主要大学赤本 (9 冊) ======
  { rank: 192, title: "東京大学 文科 前期日程", publisher: "教学社", subject: "math", level: "top", series: "赤本" },
  { rank: 193, title: "東京大学 理科 前期日程", publisher: "教学社", subject: "math", level: "top", series: "赤本" },
  { rank: 194, title: "京都大学 文系 前期日程", publisher: "教学社", subject: "math", level: "top", series: "赤本" },
  { rank: 195, title: "京都大学 理系 前期日程", publisher: "教学社", subject: "math", level: "top", series: "赤本" },
  { rank: 196, title: "早稲田大学 政治経済学部", publisher: "教学社", subject: "math", level: "top", series: "赤本" },
  { rank: 197, title: "早稲田大学 法学部", publisher: "教学社", subject: "math", level: "top", series: "赤本" },
  { rank: 198, title: "慶應義塾大学 経済学部", publisher: "教学社", subject: "math", level: "top", series: "赤本" },
  { rank: 199, title: "慶應義塾大学 法学部", publisher: "教学社", subject: "math", level: "top", series: "赤本" },
  { rank: 200, title: "MARCHの英語 (赤本シリーズ参考用)", publisher: "教学社", subject: "english", level: "advanced", series: "赤本" },
];
