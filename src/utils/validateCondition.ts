/**
 * 検索条件のバリデーション関数
 */

import type { SearchCondition, ValidationResult } from "../types";

/**
 * 検索条件のバリデーション
 * @param condition 検索条件
 * @returns バリデーション結果
 */
export function validateCondition(
  condition: SearchCondition,
): ValidationResult {
  const errors: { field: string; message: string }[] = [];

  // 最大移動時間のバリデーション（5〜120分）
  if (condition.maxTravelTime < 5 || condition.maxTravelTime > 120) {
    errors.push({
      field: "maxTravelTime",
      message: "最大移動時間は5分から120分の範囲で指定してください",
    });
  }

  // 最大乗り換え回数のバリデーション（0〜5回）
  if (condition.maxTransfers < 0 || condition.maxTransfers > 5) {
    errors.push({
      field: "maxTransfers",
      message: "最大乗り換え回数は0回から5回の範囲で指定してください",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
