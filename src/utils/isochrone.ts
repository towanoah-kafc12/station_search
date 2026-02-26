/**
 * 等時線（アイソクロン）生成ユーティリティ
 * 到達可能駅の座標から等時線ポリゴンを生成する
 */

import type { ReachableStation } from "../types/ReachableStation";
import type { Isochrone } from "../types/Isochrone";
import { getTravelTimeColorHex } from "./colorScale";

/**
 * 凸包（Convex Hull）を計算する - Graham Scan アルゴリズム
 * @param points 座標の配列
 * @returns 凸包を構成する座標の配列（反時計回り）
 */
function convexHull(points: [number, number][]): [number, number][] {
  if (points.length < 3) {
    return points;
  }

  // 最も下（y座標が小さい）の点を見つける。同じ場合は左（x座標が小さい）を選ぶ
  let start = 0;
  for (let i = 1; i < points.length; i++) {
    if (
      points[i][1] < points[start][1] ||
      (points[i][1] === points[start][1] && points[i][0] < points[start][0])
    ) {
      start = i;
    }
  }

  // 開始点を先頭に移動
  [points[0], points[start]] = [points[start], points[0]];
  const p0 = points[0];

  // 極角でソート
  const sorted = points.slice(1).sort((a, b) => {
    const angleA = Math.atan2(a[1] - p0[1], a[0] - p0[0]);
    const angleB = Math.atan2(b[1] - p0[1], b[0] - p0[0]);
    if (angleA !== angleB) {
      return angleA - angleB;
    }
    // 角度が同じ場合は距離でソート
    const distA = Math.hypot(a[0] - p0[0], a[1] - p0[1]);
    const distB = Math.hypot(b[0] - p0[0], b[1] - p0[1]);
    return distA - distB;
  });

  const hull: [number, number][] = [p0, sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const point = sorted[i];

    // 左折するまで点を削除
    while (hull.length >= 2) {
      const p1 = hull[hull.length - 2];
      const p2 = hull[hull.length - 1];
      const cross =
        (p2[0] - p1[0]) * (point[1] - p1[1]) -
        (p2[1] - p1[1]) * (point[0] - p1[0]);
      if (cross > 0) {
        break;
      }
      hull.pop();
    }

    hull.push(point);
  }

  return hull;
}

/**
 * 到達可能駅から等時線ポリゴンを生成する
 * @param reachableStations 到達可能駅の配列
 * @param maxTravelTime 最大移動時間（色分けに使用）
 * @param timeIntervals 等時線を生成する時間間隔（分）のリスト
 * @returns Isochrone配列
 */
export function generateIsochrones(
  reachableStations: ReachableStation[],
  maxTravelTime: number,
  timeIntervals: number[] = [15, 30, 45, 60],
): Isochrone[] {
  const isochrones: Isochrone[] = [];

  for (const timeMinutes of timeIntervals) {
    // この時間以内に到達可能な駅を抽出
    const stationsWithinTime = reachableStations.filter(
      (r) => r.travelTime <= timeMinutes,
    );

    if (stationsWithinTime.length < 3) {
      // 3点未満の場合はポリゴンを作成できないのでスキップ
      continue;
    }

    // 駅の座標を抽出
    const points: [number, number][] = stationsWithinTime.map((r) => [
      r.station.lat,
      r.station.lng,
    ]);

    // 凸包を計算
    const polygon = convexHull(points);

    // 色を決定
    const color = getTravelTimeColorHex(timeMinutes, maxTravelTime);

    isochrones.push({
      timeMinutes,
      polygon,
      color,
    });
  }

  return isochrones;
}
