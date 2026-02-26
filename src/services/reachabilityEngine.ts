/**
 * ReachabilityEngine - 到達可能範囲の算出エンジン
 * graphologyのDijkstra探索を使用して、指定条件内で到達可能な駅を算出する
 */

import Graph from "graphology";
import { bidirectional } from "graphology-shortest-path";
import type { ReachableStation, RouteStep } from "../types/ReachableStation";
import type { Station } from "../types/Station";
import type { SearchCondition } from "../types/SearchCondition";

// グラフのノード属性
interface NodeAttributes {
  station: Station;
}

// グラフのエッジ属性
interface EdgeAttributes {
  lineId: string;
  travelTime: number;
  requiresTransfer: boolean;
}

// 乗り換え時間（分）
const TRANSFER_TIME = 5;

/**
 * 指定条件で到達可能な駅を算出する
 * @param graph 鉄道ネットワークのグラフ
 * @param departureStationId 出発駅ID
 * @param condition 検索条件
 * @returns 到達可能駅の配列
 */
export function findReachableStations(
  graph: Graph<NodeAttributes, EdgeAttributes>,
  departureStationId: string,
  condition: SearchCondition,
): ReachableStation[] {
  // 出発駅が存在しない場合は空配列を返す
  if (!graph.hasNode(departureStationId)) {
    return [];
  }

  const reachableStations: ReachableStation[] = [];
  const visited = new Set<string>();
  const queue: {
    stationId: string;
    travelTime: number;
    transfers: number;
    route: RouteStep[];
    currentLineId: string | null;
  }[] = [];

  // 出発駅を初期化
  queue.push({
    stationId: departureStationId,
    travelTime: 0,
    transfers: 0,
    route: [],
    currentLineId: null,
  });

  while (queue.length > 0) {
    // キューから最小の移動時間を持つ駅を取り出す（優先度付きキュー的な動作）
    queue.sort((a, b) => a.travelTime - b.travelTime);
    const current = queue.shift()!;

    // すでに訪問済みの駅はスキップ
    if (visited.has(current.stationId)) {
      continue;
    }
    visited.add(current.stationId);

    // 出発駅以外を結果に追加
    if (current.stationId !== departureStationId) {
      const station = graph.getNodeAttributes(current.stationId).station;
      reachableStations.push({
        station,
        travelTime: current.travelTime,
        transfers: current.transfers,
        route: current.route,
      });
    }

    // 隣接駅を探索
    const outEdges = graph.outEdges(current.stationId);
    for (const edge of outEdges) {
      const edgeAttrs = graph.getEdgeAttributes(edge);
      const targetStationId = graph.target(edge);

      // 除外路線をスキップ
      if (condition.excludedLines.includes(edgeAttrs.lineId)) {
        continue;
      }

      // 乗り換え回数を計算
      let newTransfers = current.transfers;
      let additionalTime = 0;

      if (
        current.currentLineId !== null &&
        current.currentLineId !== edgeAttrs.lineId
      ) {
        // 路線が変わる場合は乗り換え
        newTransfers++;
        additionalTime = TRANSFER_TIME;
      }

      // 乗り換え回数の制約チェック
      if (newTransfers > condition.maxTransfers) {
        continue;
      }

      // 新しい移動時間を計算
      const newTravelTime =
        current.travelTime + edgeAttrs.travelTime + additionalTime;

      // 移動時間の制約チェック
      if (newTravelTime > condition.maxTravelTime) {
        continue;
      }

      // すでに訪問済みの駅はスキップ
      if (visited.has(targetStationId)) {
        continue;
      }

      // 新しい経路ステップを追加
      const newRoute = [
        ...current.route,
        {
          lineId: edgeAttrs.lineId,
          fromStationId: current.stationId,
          toStationId: targetStationId,
          travelTime: edgeAttrs.travelTime,
        },
      ];

      // キューに追加
      queue.push({
        stationId: targetStationId,
        travelTime: newTravelTime,
        transfers: newTransfers,
        route: newRoute,
        currentLineId: edgeAttrs.lineId,
      });
    }
  }

  return reachableStations;
}

/**
 * 2駅間の最短経路を取得する（graphology-shortest-pathを使用）
 * @param graph 鉄道ネットワークのグラフ
 * @param fromStationId 出発駅ID
 * @param toStationId 到着駅ID
 * @returns 経路の駅IDリスト、経路が存在しない場合はnull
 */
export function findShortestPath(
  graph: Graph<NodeAttributes, EdgeAttributes>,
  fromStationId: string,
  toStationId: string,
): string[] | null {
  try {
    const path = bidirectional(
      graph,
      fromStationId,
      toStationId,
      (_, attrs) => attrs.travelTime,
    );
    return path;
  } catch {
    return null;
  }
}
