/**
 * Property 5: 到達可能駅算出の正確性テスト
 * Feature: station-reachability-map, Property 5: 到達可能駅算出の正確性
 * Validates: Requirements 3.1, 3.2, 3.3
 */

import { describe } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { findReachableStations } from "./reachabilityEngine";
import { buildGraph } from "./graphService";
import type { Station } from "../types/Station";
import type { Line, LineSegment } from "../types/Line";
import type { SearchCondition } from "../types/SearchCondition";

describe("Property 5: 到達可能駅算出の正確性", () => {
  // 駅データのArbitrary
  const stationArbitrary = fc.record({
    id: fc.stringMatching(/^station_[0-9]+$/),
    name: fc.string({ minLength: 1, maxLength: 10 }),
    nameKana: fc.string({ minLength: 1, maxLength: 10 }),
    lat: fc.double({ min: 35.0, max: 36.0 }),
    lng: fc.double({ min: 139.0, max: 140.0 }),
    lineIds: fc.array(fc.stringMatching(/^line_[0-9]+$/), {
      minLength: 1,
      maxLength: 3,
    }),
    operatorId: fc.constant("operator1"),
  }) as fc.Arbitrary<Station>;

  // 路線セグメントのArbitrary
  const segmentArbitrary = (stationIds: string[]) =>
    fc
      .record({
        fromStationId: fc.constantFrom(...stationIds),
        toStationId: fc.constantFrom(...stationIds),
        travelTime: fc.integer({ min: 1, max: 20 }),
        coordinates: fc.constant([
          [139.767, 35.681],
          [139.768, 35.682],
        ] as [number, number][]),
      })
      .filter(
        (seg) => seg.fromStationId !== seg.toStationId,
      ) as fc.Arbitrary<LineSegment>;

  // 路線データのArbitrary
  const lineArbitrary = (stations: Station[]) => {
    const stationIds = stations.map((s) => s.id);
    return fc.record({
      id: fc.stringMatching(/^line_[0-9]+$/),
      name: fc.string({ minLength: 1, maxLength: 10 }),
      operatorId: fc.constant("operator1"),
      color: fc
        .hexaString({ minLength: 6, maxLength: 6 })
        .map((hex) => `#${hex}`),
      stationIds: fc.constant(stationIds),
      segments: fc.array(segmentArbitrary(stationIds), {
        minLength: 1,
        maxLength: 5,
      }),
    }) as fc.Arbitrary<Line>;
  };

  // 検索条件のArbitrary
  const conditionArbitrary = fc.record({
    maxTravelTime: fc.integer({ min: 5, max: 120 }),
    maxTransfers: fc.integer({ min: 0, max: 5 }),
    excludedLines: fc.constant([]),
  }) as fc.Arbitrary<SearchCondition>;

  test.prop(
    {
      stations: fc
        .array(stationArbitrary, { minLength: 3, maxLength: 8 })
        .map((stations) => {
          const uniqueStations = Array.from(
            new Map(stations.map((s) => [s.id, s])).values(),
          );
          return uniqueStations;
        }),
      condition: conditionArbitrary,
    },
    { numRuns: 100 },
  )(
    "任意のグラフと条件に対して、findReachableStationsが返す全ての駅はtravelTime <= maxTravelTimeを満たす",
    ({ stations, condition }) => {
      if (stations.length < 2) return;

      const lines = fc.sample(lineArbitrary(stations), 1);
      const graph = buildGraph(stations, lines);

      // 最初の駅を出発駅とする
      const departureStationId = stations[0].id;

      const result = findReachableStations(
        graph,
        departureStationId,
        condition,
      );

      // 全ての到達可能駅が移動時間の制約を満たすことを確認
      result.forEach((reachable) => {
        if (reachable.travelTime > condition.maxTravelTime) {
          throw new Error(
            `移動時間の制約違反: ${reachable.station.name} (${reachable.travelTime}分 > ${condition.maxTravelTime}分)`,
          );
        }
      });
    },
  );

  test.prop(
    {
      stations: fc
        .array(stationArbitrary, { minLength: 3, maxLength: 8 })
        .map((stations) => {
          const uniqueStations = Array.from(
            new Map(stations.map((s) => [s.id, s])).values(),
          );
          return uniqueStations;
        }),
      condition: conditionArbitrary,
    },
    { numRuns: 100 },
  )(
    "任意のグラフと条件に対して、findReachableStationsが返す全ての駅はtransfers <= maxTransfersを満たす",
    ({ stations, condition }) => {
      if (stations.length < 2) return;

      const lines = fc.sample(lineArbitrary(stations), 1);
      const graph = buildGraph(stations, lines);

      const departureStationId = stations[0].id;

      const result = findReachableStations(
        graph,
        departureStationId,
        condition,
      );

      // 全ての到達可能駅が乗り換え回数の制約を満たすことを確認
      result.forEach((reachable) => {
        if (reachable.transfers > condition.maxTransfers) {
          throw new Error(
            `乗り換え回数の制約違反: ${reachable.station.name} (${reachable.transfers}回 > ${condition.maxTransfers}回)`,
          );
        }
      });
    },
  );

  test.prop(
    {
      stations: fc
        .array(stationArbitrary, { minLength: 3, maxLength: 8 })
        .map((stations) => {
          const uniqueStations = Array.from(
            new Map(stations.map((s) => [s.id, s])).values(),
          );
          return uniqueStations;
        }),
      maxTravelTime: fc.integer({ min: 5, max: 120 }),
      maxTransfers: fc.integer({ min: 0, max: 5 }),
    },
    { numRuns: 100 },
  )(
    "任意のグラフと条件に対して、出発駅自身は結果に含まれない",
    ({ stations, maxTravelTime, maxTransfers }) => {
      if (stations.length < 2) return;

      const lines = fc.sample(lineArbitrary(stations), 1);
      const graph = buildGraph(stations, lines);

      const departureStationId = stations[0].id;
      const condition: SearchCondition = {
        maxTravelTime,
        maxTransfers,
        excludedLines: [],
      };

      const result = findReachableStations(
        graph,
        departureStationId,
        condition,
      );

      // 出発駅自身が結果に含まれないことを確認
      const hasDepartureStation = result.some(
        (r) => r.station.id === departureStationId,
      );
      if (hasDepartureStation) {
        throw new Error("出発駅自身が結果に含まれています");
      }
    },
  );

  test.prop(
    {
      stations: fc
        .array(stationArbitrary, { minLength: 3, maxLength: 8 })
        .map((stations) => {
          const uniqueStations = Array.from(
            new Map(stations.map((s) => [s.id, s])).values(),
          );
          return uniqueStations;
        }),
      condition: conditionArbitrary,
    },
    { numRuns: 100 },
  )(
    "任意のグラフと条件に対して、各到達可能駅のrouteは空でない（出発駅以外）",
    ({ stations, condition }) => {
      if (stations.length < 2) return;

      const lines = fc.sample(lineArbitrary(stations), 1);
      const graph = buildGraph(stations, lines);

      const departureStationId = stations[0].id;

      const result = findReachableStations(
        graph,
        departureStationId,
        condition,
      );

      // 各到達可能駅が経路情報を持つことを確認
      result.forEach((reachable) => {
        if (reachable.route.length === 0) {
          throw new Error(
            `到達可能駅 ${reachable.station.name} の経路情報が空です`,
          );
        }
      });
    },
  );
});
