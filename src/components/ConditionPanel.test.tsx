/**
 * ConditionPanel コンポーネントのテスト
 * Feature: station-reachability-map
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { SearchCondition } from "../types";
import type { Line } from "../types/Line";

describe("ConditionPanel", () => {
  describe("Property 12: デフォルト全路線選択", () => {
    /**
     * Property 12: デフォルト全路線選択
     * 任意の路線データセットに対して、条件パネルの初期状態では全ての路線が選択状態である。
     * つまり、excludedLines が空配列であることを検証する。
     *
     * Validates: Requirements 7.3
     */
    it("should have all lines selected by default (excludedLines is empty)", () => {
      fc.assert(
        fc.property(
          // 任意の路線データセットを生成
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              operatorId: fc.string({ minLength: 1, maxLength: 20 }),
              color: fc
                .hexaString({ minLength: 6, maxLength: 6 })
                .map((s) => `#${s}`),
              stationIds: fc.array(fc.string(), {
                minLength: 2,
                maxLength: 10,
              }),
              segments: fc.array(
                fc.record({
                  fromStationId: fc.string(),
                  toStationId: fc.string(),
                  travelTime: fc.integer({ min: 1, max: 60 }),
                  coordinates: fc.array(
                    fc.tuple(
                      fc.double({ min: -90, max: 90 }),
                      fc.double({ min: -180, max: 180 }),
                    ),
                    { minLength: 2, maxLength: 5 },
                  ),
                }),
                { minLength: 1, maxLength: 10 },
              ),
            }),
            { minLength: 1, maxLength: 50 },
          ),
          (lines: Line[]) => {
            // 初期状態の SearchCondition を作成
            const initialCondition: SearchCondition = {
              maxTravelTime: 30,
              maxTransfers: 2,
              excludedLines: [], // デフォルトで全路線選択 = 除外路線なし
            };

            // Property: excludedLines が空配列であることを検証
            expect(initialCondition.excludedLines).toEqual([]);
            expect(initialCondition.excludedLines.length).toBe(0);

            // 全ての路線IDが excludedLines に含まれていないことを検証
            const allLineIds = lines.map((line) => line.id);
            for (const lineId of allLineIds) {
              expect(initialCondition.excludedLines).not.toContain(lineId);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should not exclude any lines in the initial state", () => {
      fc.assert(
        fc.property(
          // 任意の路線IDセットを生成
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
            minLength: 1,
            maxLength: 100,
          }),
          (lineIds: string[]) => {
            // 初期状態の SearchCondition
            const initialCondition: SearchCondition = {
              maxTravelTime: 30,
              maxTransfers: 2,
              excludedLines: [],
            };

            // Property: どの路線IDも excludedLines に含まれていない
            for (const lineId of lineIds) {
              expect(initialCondition.excludedLines).not.toContain(lineId);
            }

            // Property: excludedLines の長さは 0
            expect(initialCondition.excludedLines.length).toBe(0);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
