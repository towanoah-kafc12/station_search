/**
 * Property 3: 検索条件バリデーション
 * Feature: station-reachability-map, Property 3: 検索条件バリデーション
 *
 * 任意の数値に対して、validateConditionは以下を満たす:
 * - 最大移動時間が5〜120の範囲内かつ最大乗り換え回数が0〜5の範囲内の場合のみisValid: trueを返す
 * - 範囲外の場合は対応するエラーメッセージを含むValidationResultを返す
 *
 * Validates: Requirements 2.3, 2.4, 2.6
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validateCondition } from "./validateCondition";
import type { SearchCondition } from "../types";

describe("Property 3: 検索条件バリデーション", () => {
  it("範囲内の値に対してisValid: trueを返す", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 120 }), // maxTravelTime
        fc.integer({ min: 0, max: 5 }), // maxTransfers
        (maxTravelTime, maxTransfers) => {
          const condition: SearchCondition = {
            maxTravelTime,
            maxTransfers,
            excludedLines: [],
          };

          const result = validateCondition(condition);

          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("maxTravelTimeが範囲外の場合、適切なエラーメッセージを返す", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ max: 4 }), // 5未満
          fc.integer({ min: 121 }), // 120超過
        ),
        fc.integer({ min: 0, max: 5 }), // maxTransfersは有効範囲
        (maxTravelTime, maxTransfers) => {
          const condition: SearchCondition = {
            maxTravelTime,
            maxTransfers,
            excludedLines: [],
          };

          const result = validateCondition(condition);

          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.errors.some((e) => e.field === "maxTravelTime")).toBe(
            true,
          );
          expect(
            result.errors.some((e) =>
              e.message.includes(
                "最大移動時間は5分から120分の範囲で指定してください",
              ),
            ),
          ).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("maxTransfersが範囲外の場合、適切なエラーメッセージを返す", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 120 }), // maxTravelTimeは有効範囲
        fc.oneof(
          fc.integer({ max: -1 }), // 0未満
          fc.integer({ min: 6 }), // 5超過
        ),
        (maxTravelTime, maxTransfers) => {
          const condition: SearchCondition = {
            maxTravelTime,
            maxTransfers,
            excludedLines: [],
          };

          const result = validateCondition(condition);

          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.errors.some((e) => e.field === "maxTransfers")).toBe(
            true,
          );
          expect(
            result.errors.some((e) =>
              e.message.includes(
                "最大乗り換え回数は0回から5回の範囲で指定してください",
              ),
            ),
          ).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("両方が範囲外の場合、両方のエラーメッセージを返す", () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.integer({ max: 4 }), fc.integer({ min: 121 })),
        fc.oneof(fc.integer({ max: -1 }), fc.integer({ min: 6 })),
        (maxTravelTime, maxTransfers) => {
          const condition: SearchCondition = {
            maxTravelTime,
            maxTransfers,
            excludedLines: [],
          };

          const result = validateCondition(condition);

          expect(result.isValid).toBe(false);
          expect(result.errors).toHaveLength(2);
          expect(result.errors.some((e) => e.field === "maxTravelTime")).toBe(
            true,
          );
          expect(result.errors.some((e) => e.field === "maxTransfers")).toBe(
            true,
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});
