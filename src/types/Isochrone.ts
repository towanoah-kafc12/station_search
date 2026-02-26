/**
 * 等時線（アイソクロン）の型定義
 * 同一移動時間で到達可能な範囲を示す境界線
 */

export interface Isochrone {
  timeMinutes: number; // 移動時間（分）
  polygon: [number, number][]; // 境界ポリゴン座標（緯度・経度のペア）
  color: string; // 表示色
}
