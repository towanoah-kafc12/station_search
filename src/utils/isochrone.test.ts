/**
 * 等時線生成ユーティリティのテスト
 */

import { describe, it, expect } from "vitest";
import { generateIsochrones } from "./isochrone";
import type { ReachableStation } from "../types/ReachableStation";
import type { Station } from "../types/Station";

describe("generateIsochrones", () => {
  // テスト用の駅データを作成
  const createStation = (id: string, lat: number, lng: number): Station => ({
    id,
    name: `駅${id}`,
    nameKana: `えき${id}`,
    lat,
    lng,
    lineIds: [],
    operatorId: "test",
  });

  // テスト用の到達可能駅データを作成
  const createReachableStation = (
    id: string,
    lat: number,
    lng: number,
    travelTime: number,
  ): ReachableStation => ({
    station: createStation(id, lat, lng),
    travelTime,
    transfers: 0,
    route: [],
  });

  it("到達可能駅が3点未満の場合は空配列を返す", () => {
    const reachableStations: ReachableStation[] = [
      createReachableStation("1", 35.681, 139.767, 10),
      createReachableStation("2", 35.682, 139.768, 20),
    ];

    const isochrones = generateIsochrones(reachableStations, 60);

    expect(isochrones).toEqual([]);
  });

  it("到達可能駅が3点以上の場合は等時線を生成する", () => {
    const reachableStations: ReachableStation[] = [
      createReachableStation("1", 35.681, 139.767, 10),
      createReachableStation("2", 35.682, 139.768, 20),
      createReachableStation("3", 35.68, 139.769, 25),
      createReachableStation("4", 35.679, 139.766, 35),
    ];

    const isochrones = generateIsochrones(reachableStations, 60, [15, 30, 45]);

    // 15分圏内: 1駅のみ（3点未満なのでスキップ）
    // 30分圏内: 3駅（1, 2, 3）
    // 45分圏内: 4駅（1, 2, 3, 4）
    expect(isochrones).toHaveLength(2);

    // 30分圏内の等時線
    expect(isochrones[0].timeMinutes).toBe(30);
    expect(isochrones[0].polygon.length).toBeGreaterThanOrEqual(3);
    expect(isochrones[0].color).toBeDefined();

    // 45分圏内の等時線
    expect(isochrones[1].timeMinutes).toBe(45);
    expect(isochrones[1].polygon.length).toBeGreaterThanOrEqual(3);
    expect(isochrones[1].color).toBeDefined();
  });

  it("デフォルトの時間間隔で等時線を生成する", () => {
    const reachableStations: ReachableStation[] = [
      createReachableStation("1", 35.681, 139.767, 10),
      createReachableStation("2", 35.682, 139.768, 20),
      createReachableStation("3", 35.68, 139.769, 25),
      createReachableStation("4", 35.679, 139.766, 35),
      createReachableStation("5", 35.683, 139.765, 50),
    ];

    // デフォルトは [15, 30, 45, 60]
    const isochrones = generateIsochrones(reachableStations, 60);

    // 15分圏内: 1駅（スキップ）
    // 30分圏内: 3駅
    // 45分圏内: 4駅
    // 60分圏内: 5駅
    expect(isochrones.length).toBeGreaterThan(0);
    expect(isochrones.every((iso) => iso.polygon.length >= 3)).toBe(true);
  });

  it("等時線のポリゴンは凸包として正しく生成される", () => {
    // 正方形の4点を作成
    const reachableStations: ReachableStation[] = [
      createReachableStation("1", 35.68, 139.766, 10),
      createReachableStation("2", 35.68, 139.768, 10),
      createReachableStation("3", 35.682, 139.768, 10),
      createReachableStation("4", 35.682, 139.766, 10),
    ];

    const isochrones = generateIsochrones(reachableStations, 60, [15]);

    expect(isochrones).toHaveLength(1);
    const polygon = isochrones[0].polygon;

    // 凸包は4点の正方形になるはず
    expect(polygon.length).toBe(4);

    // 全ての点が元の座標セットに含まれることを確認
    const originalCoords = reachableStations.map((r) => [
      r.station.lat,
      r.station.lng,
    ]);
    polygon.forEach((point) => {
      const found = originalCoords.some(
        (coord) => coord[0] === point[0] && coord[1] === point[1],
      );
      expect(found).toBe(true);
    });
  });

  it("空の到達可能駅配列の場合は空配列を返す", () => {
    const isochrones = generateIsochrones([], 60);
    expect(isochrones).toEqual([]);
  });
});
