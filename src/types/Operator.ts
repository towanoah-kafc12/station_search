// 事業者データの型定義
export interface Operator {
  id: string; // 事業者ID（例: "JR_East"）
  name: string; // 事業者名（例: "JR東日本"）
  lineIds: string[]; // 運営路線IDリスト
}
