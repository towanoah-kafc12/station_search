/**
 * GraphService のユニットテスト
 */

import { describe, it, expect } from "vitest";
import { buildGraph, getStationFromGraph, getGraphStats } from "./graphService";
import type { Station } from "../types/Station";
import type { Line } from "../types/Line";

describe("GraphService", () => {
  // テスト用のダミーデータ
  const testStations: Station[] = [
    {
      id: "station1",
      name: "駅1",
      nameKana: "えき1",
      lat: 35.681,
      lng: 139.767,
      lineIds: ["line1"],
      operatorId: "operator1",
    },
    {
      id: "station2",
      name: "駅2",
      nameKana: "えき2",
      lat: 35.682,
      lng: 139.768,
      lineIds: ["line1"],
      operatorId: "operator1",
    },
    {
      id: "station3",
      name: "駅3",
      nameKana: "えき3",
      lat: 35.683,
      lng: 139.769,
      lineIds: ["line1", "line2"],
      operatorId: "operator1",
    },
  ];

  const testLines: Line[] = [
    {
      id: "line1",
      name: "路線1",
      operatorId: "operator1",
      color: "#FF0000",
      stationIds: ["station1", "station2", "station3"],
      segments: [
        {
          fromStationId: "station1",
          toStationId: "station2",
          travelTime: 3,
          coordinates: [
            [139.767, 35.681],
            [139.768, 35.682],
          ],
        },
        {
          fromStationId: "station2",
          toStationId: "station3",
          travelTime: 5,
          coordinates: [
            [139.768, 35.682],
            [139.769, 35.683],
          ],
        },
      ],
    },
  ];

  describe("buildGraph", () => {
    it("駅をノードとして追加する", () => {
      const graph = buildGraph(testStations, testLines);

      expect(graph.hasNode("station1")).toBe(true);
      expect(graph.hasNode("station2")).toBe(true);
      expect(graph.hasNode("station3")).toBe(true);
    });

    it("路線セグメントを双方向エッジとして追加する", () => {
      const graph = buildGraph(testStations, testLines);

      // station1 -> station2
      expect(graph.hasDirectedEdge("station1", "station2")).toBe(true);
      // station2 -> station1 (逆方向)
      expect(graph.hasDirectedEdge("station2", "station1")).toBe(true);
      // station2 -> station3
      expect(graph.hasDirectedEdge("station2", "station3")).toBe(true);
      // station3 -> station2 (逆方向)
      expect(graph.hasDirectedEdge("station3", "station2")).toBe(true);
    });

    it("エッジに正しい移動時間を設定する", () => {
      const graph = buildGraph(testStations, testLines);

      const edges1 = graph.directedEdges("station1", "station2");
      const attrs1 = graph.getEdgeAttributes(edges1[0]);
      expect(attrs1.travelTime).toBe(3);

      const edges2 = graph.directedEdges("station2", "station3");
      const attrs2 = graph.getEdgeAttributes(edges2[0]);
      expect(attrs2.travelTime).toBe(5);
    });

    it("エッジに路線IDを設定する", () => {
      const graph = buildGraph(testStations, testLines);

      const edges = graph.directedEdges("station1", "station2");
      const attrs = graph.getEdgeAttributes(edges[0]);
      expect(attrs.lineId).toBe("line1");
    });

    it("空のデータでもエラーなく動作する", () => {
      const graph = buildGraph([], []);
      expect(graph.order).toBe(0);
      expect(graph.size).toBe(0);
    });
  });

  describe("getStationFromGraph", () => {
    it("存在する駅を取得できる", () => {
      const graph = buildGraph(testStations, testLines);
      const station = getStationFromGraph(graph, "station1");

      expect(station).toBeDefined();
      expect(station?.id).toBe("station1");
      expect(station?.name).toBe("駅1");
    });

    it("存在しない駅はundefinedを返す", () => {
      const graph = buildGraph(testStations, testLines);
      const station = getStationFromGraph(graph, "nonexistent");

      expect(station).toBeUndefined();
    });
  });

  describe("getGraphStats", () => {
    it("グラフの統計情報を取得できる", () => {
      const graph = buildGraph(testStations, testLines);
      const stats = getGraphStats(graph);

      expect(stats.nodeCount).toBe(3);
      // 2セグメント × 2方向 = 4エッジ
      expect(stats.edgeCount).toBe(4);
      expect(stats.averageDegree).toBeCloseTo(4 / 3, 2);
    });

    it("空のグラフでも動作する", () => {
      const graph = buildGraph([], []);
      const stats = getGraphStats(graph);

      expect(stats.nodeCount).toBe(0);
      expect(stats.edgeCount).toBe(0);
      expect(stats.averageDegree).toBe(0);
    });
  });
});
