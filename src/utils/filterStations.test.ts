/**
 * Property 1: 駅名フィルタリングの正確性
 * Feature: station-reachability-map, Property 1: 駅名フィルタリングの正確性
 * Validates: Requirements 1.2
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { filterStations } from "./filterStations";
import type { Station } from "../types";

describe("Property 1: 駅名フィルタリングの正確性", () => {
  // 駅データを生成するArbitrary
  const stationArbitrary = fc.record({
    id: fc.string({ minLength: 1 }),
    name: fc.string({ minLength: 1 }),
    nameKana: fc.string({ minLength: 1 }),
    lat: fc.double({ min: -90, max: 90 }),
    lng: fc.double({ min: -180, max: 180 }),
    lineIds: fc.array(fc.string()),
    operatorId: fc.string(),
  }) as fc.Arbitrary<Station>;

  it("返却される全ての駅は検索文字列を部分文字列として含む", () => {
    fc.assert(
      fc.property(
        fc.array(stationArbitrary, { minLength: 0, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (stations, query) => {
          const results = filterStations(stations, query);
          const normalizedQuery = query.toLowerCase().trim();

          // 空文字列の場合は空配列を返すべき
          if (normalizedQuery === "") {
            expect(results).toEqual([]);
            return true;
          }

          // 返却された全ての駅が検索文字列を含むことを検証
          for (const station of results) {
            const nameMatch = station.name
              .toLowerCase()
              .includes(normalizedQuery);
            const kanaMatch = station.nameKana
              .toLowerCase()
              .includes(normalizedQuery);

            expect(nameMatch || kanaMatch).toBe(true);
          }

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("検索文字列を含まない駅は返されない", () => {
    fc.assert(
      fc.property(
        fc.array(stationArbitrary, { minLength: 0, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (stations, query) => {
          const results = filterStations(stations, query);
          const normalizedQuery = query.toLowerCase().trim();

          // 空文字列の場合は空配列を返すべき
          if (normalizedQuery === "") {
            expect(results).toEqual([]);
            return true;
          }

          // 返されなかった駅が検索文字列を含まないことを検証
          const resultIds = new Set(results.map((s) => s.id));
          const notReturned = stations.filter((s) => !resultIds.has(s.id));

          for (const station of notReturned) {
            const nameMatch = station.name
              .toLowerCase()
              .includes(normalizedQuery);
            const kanaMatch = station.nameKana
              .toLowerCase()
              .includes(normalizedQuery);

            expect(nameMatch || kanaMatch).toBe(false);
          }

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("空文字列またはホワイトスペースのみの検索文字列では空配列を返す", () => {
    fc.assert(
      fc.property(
        fc.array(stationArbitrary, { minLength: 0, maxLength: 50 }),
        fc.oneof(
          fc.constant(""),
          fc.constant(" "),
          fc.constant("  "),
          fc.constant("\t"),
          fc.constant("\n"),
        ),
        (stations, query) => {
          const results = filterStations(stations, query);
          expect(results).toEqual([]);
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("大文字小文字を区別せずに検索する", () => {
    fc.assert(
      fc.property(
        fc.array(stationArbitrary, { minLength: 1, maxLength: 50 }),
        fc.integer({ min: 0, max: 49 }),
        fc.oneof(fc.constant("upper"), fc.constant("lower")),
        (stations, index, caseType) => {
          if (stations.length === 0) return true;

          const targetStation = stations[index % stations.length];

          // 空白のみの駅名の場合はスキップ
          if (
            targetStation.name.trim() === "" &&
            targetStation.nameKana.trim() === ""
          ) {
            return true;
          }

          const searchString =
            targetStation.name.trim().length > 0
              ? targetStation.name.trim().substring(0, 1)
              : targetStation.nameKana.trim().substring(0, 1);

          const query =
            caseType === "upper"
              ? searchString.toUpperCase()
              : searchString.toLowerCase();

          const results = filterStations(stations, query);

          // targetStationが結果に含まれることを検証
          const found = results.some((s) => s.id === targetStation.id);
          expect(found).toBe(true);

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });
});
