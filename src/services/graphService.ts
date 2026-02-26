/**
 * GraphService - 鉄道ネットワークのグラフ構造を構築・管理する
 * graphologyライブラリを使用して駅をノード、駅間接続をエッジとしたグラフを構築する
 */

import Graph from "graphology";
import type { Station } from "../types/Station";
import type { Line } from "../types/Line";

// グラフのノード属性
interface NodeAttributes {
  station: Station;
}

// グラフのエッジ属性
interface EdgeAttributes {
  lineId: string;
  travelTime: number; // 移動時間（分）
  requiresTransfer: boolean; // 乗り換えが必要かどうか
}

// 乗り換え時間（分）- Phase 2では固定値
const TRANSFER_TIME = 5;

/**
 * 駅と路線データからgraphologyグラフを構築する
 * @param stations 駅データの配列
 * @param lines 路線データの配列
 * @returns 構築されたグラフ
 */
export function buildGraph(
  stations: Station[],
  lines: Line[],
): Graph<NodeAttributes, EdgeAttributes> {
  const graph = new Graph<NodeAttributes, EdgeAttributes>({
    type: "directed",
    multi: true, // 同じ駅間に複数の路線がある場合を許容
  });

  // 駅をノードとして追加
  stations.forEach((station) => {
    graph.addNode(station.id, { station });
  });

  // 路線の各セグメントをエッジとして追加
  lines.forEach((line) => {
    line.segments.forEach((segment) => {
      // 順方向のエッジ
      if (
        graph.hasNode(segment.fromStationId) &&
        graph.hasNode(segment.toStationId)
      ) {
        graph.addDirectedEdge(segment.fromStationId, segment.toStationId, {
          lineId: line.id,
          travelTime: segment.travelTime,
          requiresTransfer: false,
        });

        // 逆方向のエッジも追加（往復可能）
        graph.addDirectedEdge(segment.toStationId, segment.fromStationId, {
          lineId: line.id,
          travelTime: segment.travelTime,
          requiresTransfer: false,
        });
      }
    });
  });

  // 同一駅での路線間乗り換えエッジを追加
  addTransferEdges(graph, stations, lines);

  return graph;
}

/**
 * 同一駅での路線間乗り換えエッジを追加する
 * @param graph グラフインスタンス
 * @param stations 駅データの配列
 * @param lines 路線データの配列
 */
function addTransferEdges(
  graph: Graph<NodeAttributes, EdgeAttributes>,
  stations: Station[],
  lines: Line[],
): void {
  // 各駅について、その駅を通る路線を特定
  stations.forEach((station) => {
    const linesAtStation = lines.filter((line) =>
      line.stationIds.includes(station.id),
    );

    // 2路線以上が交差する駅の場合、乗り換えエッジを追加
    if (linesAtStation.length >= 2) {
      // 実際には同じノードなので、乗り換えエッジは不要
      // グラフ探索時に路線変更を検出して乗り換え回数をカウントする
      // ここでは乗り換え時間を考慮するため、特別な処理は不要
    }
  });
}

/**
 * グラフから駅ノードを取得する
 * @param graph グラフインスタンス
 * @param stationId 駅ID
 * @returns 駅データ、存在しない場合はundefined
 */
export function getStationFromGraph(
  graph: Graph<NodeAttributes, EdgeAttributes>,
  stationId: string,
): Station | undefined {
  if (!graph.hasNode(stationId)) {
    return undefined;
  }
  return graph.getNodeAttributes(stationId).station;
}

/**
 * グラフの統計情報を取得する（デバッグ用）
 * @param graph グラフインスタンス
 * @returns 統計情報
 */
export function getGraphStats(graph: Graph<NodeAttributes, EdgeAttributes>): {
  nodeCount: number;
  edgeCount: number;
  averageDegree: number;
} {
  const nodeCount = graph.order;
  const edgeCount = graph.size;
  const averageDegree = nodeCount > 0 ? edgeCount / nodeCount : 0;

  return {
    nodeCount,
    edgeCount,
    averageDegree,
  };
}
