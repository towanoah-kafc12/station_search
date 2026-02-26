/**
 * 路線オーバーレイ生成のテスト
 */

import { describe, it, expect } from "vitest";
import { generateRouteOverlays } from "./routeOverlay";
import type { Line } from "../types/Line";
import type { ReachableStation } from "../types/ReachableStation";
import type { Station } from "../types/Station";

describe("generateRouteOverlays", () => {
  it("路線データからRouteOverlayを生成する", () => {
    const testStations: Station[] = [
      {
        id: "station1",
        name: "駅1",
        nameKana: "えき1",
        lat: 35.6812,
        lng: 139.7671,
        lineIds: ["line1"],
        operatorId: "operator1",
      },
      {
        id: "station2",
        name: "駅2",
        nameKana: "えき2",
        lat: 35.6751,
        lng: 139.763,
        lineIds: ["line1"],
        operatorId: "operator1",
      },
    ];

    const testLines: Line[] = [
      {
        id: "line1",
        name: "テスト線",
        operatorId: "operator1",
        color: "#FF0000",
        stationIds: ["station1", "station2"],
        segments: [
          {
            fromStationId: "station1",
            toStationId: "station2",
            travelTime: 5,
            coordinates: [
              [139.7671, 35.6812],
              [139.763, 35.6751],
            ],
          },
        ],
      },
    ];

    const reachableStations: ReachableStation[] = [
      {
        station: testStations[1],
        travelTime: 5,
        transfers: 0,
        route: [],
      },
    ];

    const overlays = generateRouteOverlays(testLines, reachableStations);

    expect(overlays).toHaveLength(1);
    expect(overlays[0].lineId).toBe("line1");
    expect(overlays[0].lineName).toBe("テスト線");
    expect(overlays[0].color).toBe("#FF0000");
    expect(overlays[0].isReachable).toBe(true);
    expect(overlays[0].coordinates).toHaveLength(2);
  });

  it("到達可能駅がない場合、isReachableはfalseになる", () => {
    const testLines: Line[] = [
      {
        id: "line1",
        name: "テスト線",
        operatorId: "operator1",
        color: "#FF0000",
        stationIds: ["station1", "station2"],
        segments: [
          {
            fromStationId: "station1",
            toStationId: "station2",
            travelTime: 5,
            coordinates: [
              [139.7671, 35.6812],
              [139.763, 35.6751],
            ],
          },
        ],
      },
    ];

    const reachableStations: ReachableStation[] = [];

    const overlays = generateRouteOverlays(testLines, reachableStations);

    expect(overlays).toHaveLength(1);
    expect(overlays[0].isReachable).toBe(false);
  });

  it("複数セグメントの座標を正しく結合する", () => {
    const testLines: Line[] = [
      {
        id: "line1",
        name: "テスト線",
        operatorId: "operator1",
        color: "#FF0000",
        stationIds: ["station1", "station2", "station3"],
        segments: [
          {
            fromStationId: "station1",
            toStationId: "station2",
            travelTime: 5,
            coordinates: [
              [139.7671, 35.6812],
              [139.763, 35.6751],
            ],
          },
          {
            fromStationId: "station2",
            toStationId: "station3",
            travelTime: 5,
            coordinates: [
              [139.763, 35.6751],
              [139.7576, 35.6658],
            ],
          },
        ],
      },
    ];

    const reachableStations: ReachableStation[] = [];

    const overlays = generateRouteOverlays(testLines, reachableStations);

    expect(overlays).toHaveLength(1);
    // 最初のセグメントの全座標 + 2番目のセグメントの2番目以降の座標
    expect(overlays[0].coordinates).toHaveLength(3);
    expect(overlays[0].coordinates[0]).toEqual([139.7671, 35.6812]);
    expect(overlays[0].coordinates[1]).toEqual([139.763, 35.6751]);
    expect(overlays[0].coordinates[2]).toEqual([139.7576, 35.6658]);
  });

  it("空の路線配列に対して空の配列を返す", () => {
    const overlays = generateRouteOverlays([], []);
    expect(overlays).toHaveLength(0);
  });
});
