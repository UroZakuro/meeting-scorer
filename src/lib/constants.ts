// 話速（文字/分）。日本語の平均的な話速
export const CHARS_PER_MINUTE = 350;

// フィラー辞書
export const FILLER_WORDS = [
  "えーと", "ええと", "えー", "えっと",
  "あの", "あのー", "あのう",
  "まあ", "まー",
  "なんか", "なんかその",
  "その", "そのー",
  "ちょっと",
  "とりあえず",
  "ていうか",
];

// 採点軸の定義
export const SCORE_AXES = [
  { id: 1, name: "会議の必要性",          maxDeduction: 20 },
  { id: 2, name: "結論とアクション",      maxDeduction: 25 },
  { id: 3, name: "時間対効果",            maxDeduction: 15 },
  { id: 4, name: "目的・アジェンダ",     maxDeduction: 10 },
  { id: 5, name: "発言の偏り",            maxDeduction: 10 },
  { id: 6, name: "発言の中身",            maxDeduction: 10 },
  { id: 7, name: "ノイズ（フィラー・脱線・繰り返し）", maxDeduction: 10 },
];

// フリーミアム制限
export const FREE_MONTHLY_EVALUATIONS = 3;
export const FREE_MAX_HISTORY = 3;

// 価格（仮）
export const PRICE_MONTHLY_JPY = 480;
export const PRICE_YEARLY_JPY = 3800;
