// 路線オーバーレイの型定義
export interface RouteOverlay {
  lineId: string;
  lineName: string;
  color: string;
  coordinates: [number, number][];
  isReachable: boolean; // 到達可能範囲内かどうか
}
