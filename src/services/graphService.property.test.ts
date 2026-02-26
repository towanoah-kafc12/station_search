/**
 * Property 6: グラフ構築とエッジ重みの正確性テスト
 * Feature: station-reachability-map, Property 6: グラフ構築とエッジ重みの正確性
 * Validates: Requirements 3.4, 3.5
 */

import { describe, it } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { buildGraph } from "./graphService";
import type { Station } from "../types/Station";
import type { Line, LineSegment } from "../types/Line";

describe("Property 6: グラフ構築とエッジ重みの正確性", () => {
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
        travelTime: fc.integer({ min: 1, max: 30 }),
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

  test.prop(
    {
      stations: fc
        .array(stationArbitrary, { minLength: 2, maxLength: 10 })
        .map((stations) => {
          // IDの重複を除去
          const uniqueStations = Array.from(
            new Map(stations.map((s) => [s.id, s])).values(),
          );
          return uniqueStations;
        }),
    },
    { numRuns: 100 },
  )(
    "任意の路線データに対して、buildGraphが生成するグラフの各エッジのtravelTimeは、路線セグメントの所要時間と一致する",
    ({ stations }) => {
      // 路線データを生成
      const lines =
        stations.length >= 2 ? [lineArbitrary(stations).sample()] : [];

      const graph = buildGraph(stations, lines);

      // 全ての路線セグメントについて検証
      lines.forEach((line) => {
        line.segments.forEach((segment) => {
          // グラフにエッジが存在することを確認
          if (
            graph.hasNode(segment.fromStationId) &&
            graph.hasNode(segment.toStationId)
          ) {
            const hasEdge = graph.hasDirectedEdge(
              segment.fromStationId,
              segment.toStationId,
            );

            if (hasEdge) {
              const edge = graph.directedEdge(
                segment.fromStationId,
                segment.toStationId,
              );
              const attrs = graph.getEdgeAttributes(edge);

              // エッジの移動時間がセグメントの所要時間と一致することを確認
              if (attrs.travelTime !== segment.travelTime) {
                throw new Error(
                  `エッジの移動時間が一致しません: expected ${segment.travelTime}, got ${attrs.travelTime}`,
                );
              }

              // エッジの路線IDが正しいことを確認
              if (attrs.lineId !== line.id) {
                throw new Error(
                  `エッジの路線IDが一致しません: expected ${line.id}, got ${attrs.lineId}`,
                );
              }
            }
          }
        });
      });
    },
  );

  test.prop(
    {
      stations: fc
        .array(stationArbitrary, { minLength: 2, maxLength: 10 })
        .map((stations) => {
          const uniqueStations = Array.from(
            new Map(stations.map((s) => [s.id, s])).values(),
          );
          return uniqueStations;
        }),
    },
    { numRuns: 100 },
  )(
    "任意の路線データに対して、buildGraphは双方向のエッジを生成する（往復可能）",
    ({ stations }) => {
      const lines =
        stations.length >= 2 ? [lineArbitrary(stations).sample()] : [];

      const graph = buildGraph(stations, lines);

      // 全ての路線セグメントについて双方向エッジを検証
      lines.forEach((line) => {
        line.segments.forEach((segment) => {
          if (
            graph.hasNode(segment.fromStationId) &&
            graph.hasNode(segment.toStationId)
          ) {
            const hasForward = graph.hasDirectedEdge(
              segment.fromStationId,
              segment.toStationId,
            );
            const hasBackward = graph.hasDirectedEdge(
              segment.toStationId,
              segment.fromStationId,
            );

            if (hasForward && !hasBackward) {
              throw new Error(
                `逆方向のエッジが存在しません: ${segment.toStationId} -> ${segment.fromStationId}`,
              );
            }

            if (hasForward && hasBackward) {
              const forwardEdge = graph.directedEdge(
                segment.fromStationId,
                segment.toStationId,
              );
              const backwardEdge = graph.directedEdge(
                segment.toStationId,
                segment.fromStationId,
              );

              const forwardAttrs = graph.getEdgeAttributes(forwardEdge);
              const backwardAttrs = graph.getEdgeAttributes(backwardEdge);

              // 双方向のエッジは同じ移動時間を持つべき
              if (forwardAttrs.travelTime !== backwardAttrs.travelTime) {
                throw new Error(
                  `双方向エッジの移動時間が一致しません: forward=${forwardAttrs.travelTime}, backward=${backwardAttrs.travelTime}`,
                );
              }
            }
          }
        });
      });
    },
  );

  test.prop(
    {
      stations: fc
        .array(stationArbitrary, { minLength: 1, maxLength: 10 })
        .map((stations) => {
          const uniqueStations = Array.from(
            new Map(stations.map((s) => [s.id, s])).values(),
          );
          return uniqueStations;
        }),
    },
    { numRuns: 100 },
  )(
    "任意の駅データに対して、buildGraphは全ての駅をノードとして追加する",
    ({ stations }) => {
      const graph = buildGraph(stations, []);

      stations.forEach((station) => {
        if (!graph.hasNode(station.id)) {
          throw new Error(`駅 ${station.id} がグラフに追加されていません`);
        }

        const nodeAttrs = graph.getNodeAttributes(station.id);
        if (nodeAttrs.station.id !== station.id) {
          throw new Error(
            `ノード属性の駅IDが一致しません: expected ${station.id}, got ${nodeAttrs.station.id}`,
          );
        }
      });
    },
  );
});
