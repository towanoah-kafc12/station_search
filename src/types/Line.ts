// 路線データの型定義
export interface Line {
  id: string; // 一意の路線ID（例: "JR_yamanote"）
  name: string; // 路線名（例: "山手線"）
  operatorId: string; // 事業者ID
  color: string; // 路線カラー（例: "#80C241"）
  stationIds: string[]; // 駅IDリスト（順序付き）
  segments: LineSegment[];
}

export interface LineSegment {
  fromStationId: string;
  toStationId: string;
  travelTime: number; // 所要時間（分）- 時刻表データから算出
  coordinates: [number, number][]; // 経路座標（ポリライン描画用）
}
