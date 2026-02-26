/**
 * 路線オーバーレイ生成ユーティリティ
 * 路線データからRouteOverlayを生成する
 */

import type { Line } from "../types/Line";
import type { RouteOverlay } from "../types/RouteOverlay";
import type { ReachableStation } from "../types/ReachableStation";

/**
 * 路線データから路線オーバーレイを生成する
 * @param lines 路線データの配列
 * @param reachableStations 到達可能駅の配列（到達可能判定に使用）
 * @returns RouteOverlay配列
 */
export function generateRouteOverlays(
  lines: Line[],
  reachableStations: ReachableStation[],
): RouteOverlay[] {
  // 到達可能な駅IDのセットを作成（高速検索用）
  const reachableStationIds = new Set(
    reachableStations.map((r) => r.station.id),
  );

  return lines.map((line) => {
    // この路線が到達可能範囲内かどうかを判定
    // 路線上の駅のいずれかが到達可能であれば、その路線は到達可能とみなす
    const isReachable = line.stationIds.some((stationId) =>
      reachableStationIds.has(stationId),
    );

    // 全セグメントの座標を結合してポリラインを作成
    const coordinates: [number, number][] = [];
    for (const segment of line.segments) {
      // 最初のセグメントの場合は始点も追加
      if (coordinates.length === 0) {
        coordinates.push(...segment.coordinates);
      } else {
        // 2番目以降のセグメントは始点を除いて追加（重複を避ける）
        coordinates.push(...segment.coordinates.slice(1));
      }
    }

    return {
      lineId: line.id,
      lineName: line.name,
      color: line.color,
      coordinates,
      isReachable,
    };
  });
}
