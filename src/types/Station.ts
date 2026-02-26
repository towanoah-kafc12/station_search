// 駅データの型定義
export interface Station {
  id: string; // 一意の駅ID（例: "tokyo_JR_001"）
  name: string; // 駅名（例: "東京"）
  nameKana: string; // 駅名かな（例: "とうきょう"）
  lat: number; // 緯度
  lng: number; // 経度
  lineIds: string[]; // 所属路線IDリスト
  operatorId: string; // 事業者ID
}
