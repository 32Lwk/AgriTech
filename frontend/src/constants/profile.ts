export const GENDER_OPTIONS = [
  { label: "男性", value: "male" },
  { label: "女性", value: "female" },
  { label: "その他", value: "other" },
  { label: "回答しない", value: "prefer_not_to_say" },
];

export const ROLE_OPTIONS = [
  { label: "労働者", value: "worker" },
  { label: "農家", value: "farmer" },
  { label: "管理者", value: "admin" },
];

export const EXPERIENCE_ROLE_OPTIONS = [
  { label: "労働者として体験", value: "worker", description: "学生や副業として参加したい方向け" },
  { label: "農家として体験", value: "farmer", description: "現場運営や募集管理を体験したい方向け" },
];

export const OCCUPATION_OPTIONS = [
  "高校生",
  "大学生",
  "フリーランス",
  "会社員",
  "農家",
  "運営スタッフ",
  "その他",
];

export const LOCATION_OPTIONS = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
];

export const INTEREST_FARMING_BASE_OPTIONS = [
  { label: "有機・サステナブル農業", value: "organic" },
  { label: "観光農園・アグリツーリズム", value: "agritourism" },
  { label: "果樹・ワイナリー体験", value: "orchard" },
  { label: "畜産・酪農", value: "livestock" },
];

export const INTEREST_FARMING_EXTRA_OPTIONS = [
  { label: "スマート農業／テクノロジー", value: "technology" },
  { label: "6次産業・加工品づくり", value: "value_added" },
  { label: "地域コミュニティづくり", value: "community" },
  { label: "季節イベント・短期収穫", value: "seasonal" },
  { label: "環境保全型農業", value: "conservation" },
  { label: "伝統作物・在来品種", value: "heirloom" },
];

export const INTEREST_WORKSTYLE_BASE_OPTIONS = [
  { label: "短期集中（1〜2週間）", value: "short_term" },
  { label: "週1〜2日の副業", value: "side_job" },
  { label: "長期インターン", value: "internship" },
  { label: "移住・長期滞在", value: "migration" },
];

export const INTEREST_WORKSTYLE_EXTRA_OPTIONS = [
  { label: "リモート×現地ハイブリッド", value: "hybrid" },
  { label: "家族・友人と参加したい", value: "with_family" },
  { label: "教育・ワークショップ", value: "education" },
  { label: "キャリアチェンジを検討中", value: "career_change" },
  { label: "週末だけ参加したい", value: "weekend_only" },
  { label: "夜間・早朝限定", value: "time_specific" },
];

export const INTEREST_FARMING_OPTIONS = [
  ...INTEREST_FARMING_BASE_OPTIONS,
  ...INTEREST_FARMING_EXTRA_OPTIONS,
];

export const INTEREST_WORKSTYLE_OPTIONS = [
  ...INTEREST_WORKSTYLE_BASE_OPTIONS,
  ...INTEREST_WORKSTYLE_EXTRA_OPTIONS,
];

export const INTEREST_OPTIONS = [
  ...INTEREST_FARMING_OPTIONS,
  ...INTEREST_WORKSTYLE_OPTIONS,
];

export const FARMER_FARM_TYPE_OPTIONS = [
  { label: "露地野菜", value: "open_field" },
  { label: "施設園芸（ビニールハウスなど）", value: "greenhouse" },
  { label: "果樹園", value: "orchard" },
  { label: "茶畑", value: "tea" },
  { label: "米作", value: "rice" },
  { label: "花卉・観葉植物", value: "flowers" },
  { label: "畜産", value: "livestock" },
  { label: "加工・6次産業", value: "value_added" },
];

export const FARMER_BUSY_SEASON_OPTIONS = [
  { label: "春（3〜5月）", value: "spring" },
  { label: "夏（6〜8月）", value: "summer" },
  { label: "秋（9〜11月）", value: "autumn" },
  { label: "冬（12〜2月）", value: "winter" },
  { label: "通年", value: "all_year" },
];

export const FARMER_RECRUITMENT_SIZE_OPTIONS = [
  { label: "1〜2名", value: "1_2" },
  { label: "3〜5名", value: "3_5" },
  { label: "6〜10名", value: "6_10" },
  { label: "11名以上", value: "11_plus" },
  { label: "柔軟に相談したい", value: "flexible" },
];

