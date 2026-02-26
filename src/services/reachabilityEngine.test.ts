/**
 * ReachabilityEngine のユニットテスト
 */

import { describe, it, expect } from "vitest";
import { findReachableStations, findShortestPath } from "./reachabilityEngine";
import { buildGraph } from "./graphService";
import type { Station } from "../types/Station";
import type { Line } from "../types/Line";
import type { SearchCondition } from "../types/SearchCondition";

describe("ReachabilityEngine", () => {
  // テスト用のダミーデータ
  const testStations: Station[] = [
    {
      id: "tokyo",
      name: "東京",
      nameKana: "とうきょう",
      lat: 35.681,
      lng: 139.767,
      lineIds: ["yamanote"],
      operatorId: "JR_East",
    },
    {
      id: "yurakucho",
      name: "有楽町",
      nameKana: "ゆうらくちょう",
      lat: 35.675,
      lng: 139.763,
      lineIds: ["yamanote"],
      operatorId: "JR_East",
    },
    {
      id: "shimbashi",
      name: "新橋",
      nameKana: "しんばし",
      lat: 35.666,
      lng: 139.758,
      lineIds: ["yamanote"],
      operatorId: "JR_East",
    },
    {
      id: "shibuya",
      name: "渋谷",
      nameKana: "しぶや",
      lat: 35.658,
      lng: 139.702,
      lineIds: ["yamanote"],
      operatorId: "JR_East",
    },
  ];

  const testLines: Line[] = [
    {
      id: "yamanote",
      name: "山手線",
      operatorId: "JR_East",
      color: "#9ACD32",
      stationIds: ["tokyo", "yurakucho", "shimbashi", "shibuya"],
      segments: [
        {
          fromStationId: "tokyo",
          toStationId: "yurakucho",
          travelTime: 2,
          coordinates: [
            [139.767, 35.681],
            [139.763, 35.675],
          ],
        },
        {
          fromStationId: "yurakucho",
          toStationId: "shimbashi",
          travelTime: 2,
          coordinates: [
            [139.763, 35.675],
            [139.758, 35.666],
          ],
        },
        {
          fromStationId: "shimbashi",
          toStationId: "shibuya",
          travelTime: 15,
          coordinates: [
            [139.758, 35.666],
            [139.702, 35.658],
          ],
        },
      ],
    },
  ];

  describe("findReachableStations", () => {
    it("指定条件内で到達可能な駅を返す", () => {
      const graph = buildGraph(testStations, testLines);
      const condition: SearchCondition = {
        maxTravelTime: 10,
        maxTransfers: 0,
        excludedLines: [],
      };

      const result = findReachableStations(graph, "tokyo", condition);

      // 東京から10分以内: 有楽町(2分)、新橋(4分)
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.some((r) => r.station.id === "yurakucho")).toBe(true);
      expect(result.some((r) => r.station.id === "shimbashi")).toBe(true);
    });

    it("移動時間の制約を正しく適用する", () => {
      const graph = buildGraph(testStations, testLines);
      const condition: SearchCondition = {
        maxTravelTime: 3,
        maxTransfers: 0,
        excludedLines: [],
      };

      const result = findReachableStations(graph, "tokyo", condition);

      // 全ての結果が移動時間3分以内であることを確認
      result.forEach((r) => {
        expect(r.travelTime).toBeLessThanOrEqual(3);
      });
    });

    it("乗り換え回数の制約を正しく適用する", () => {
      const graph = buildGraph(testStations, testLines);
      const condition: SearchCondition = {
        maxTravelTime: 60,
        maxTransfers: 0,
        excludedLines: [],
      };

      const result = findReachableStations(graph, "tokyo", condition);

      // 全ての結果が乗り換え0回であることを確認
      result.forEach((r) => {
        expect(r.transfers).toBe(0);
      });
    });

    it("除外路線を正しく適用する", () => {
      const graph = buildGraph(testStations, testLines);
      const condition: SearchCondition = {
        maxTravelTime: 60,
        maxTransfers: 5,
        excludedLines: ["yamanote"],
      };

      const result = findReachableStations(graph, "tokyo", condition);

      // 山手線を除外した場合、到達可能駅は0件
      expect(result.length).toBe(0);
    });

    it("存在しない出発駅の場合は空配列を返す", () => {
      const graph = buildGraph(testStations, testLines);
      const condition: SearchCondition = {
        maxTravelTime: 60,
        maxTransfers: 5,
        excludedLines: [],
      };

      const result = findReachableStations(graph, "nonexistent", condition);

      expect(result).toEqual([]);
    });

    it("出発駅自身は結果に含まれない", () => {
      const graph = buildGraph(testStations, testLines);
      const condition: SearchCondition = {
        maxTravelTime: 60,
        maxTransfers: 5,
        excludedLines: [],
      };

      const result = findReachableStations(graph, "tokyo", condition);

      expect(result.some((r) => r.station.id === "tokyo")).toBe(false);
    });
  });

  describe("findShortestPath", () => {
    it("2駅間の最短経路を返す", () => {
      const graph = buildGraph(testStations, testLines);

      const path = findShortestPath(graph, "tokyo", "shimbashi");

      expect(path).not.toBeNull();
      expect(path).toContain("tokyo");
      expect(path).toContain("shimbashi");
    });

    it("経路が存在しない場合はnullを返す", () => {
      const graph = buildGraph(testStations, testLines);

      const path = findShortestPath(graph, "tokyo", "nonexistent");

      expect(path).toBeNull();
    });
  });
});
