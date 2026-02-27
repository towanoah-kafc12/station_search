/**
 * groupLinesByOperator - 路線を事業者ごとにグループ化する関数
 */

import type { Line } from "../types/Line";
import type { Operator } from "../types/Operator";

export interface LineGroup {
  operator: Operator;
  lines: Line[];
}

/**
 * 路線を事業者ごとにグループ化する
 * @param lines 路線リスト
 * @param operators 事業者リスト
 * @returns 事業者ごとにグループ化された路線リスト
 */
export function groupLinesByOperator(
  lines: Line[],
  operators: Operator[],
): LineGroup[] {
  const groups: LineGroup[] = [];

  for (const operator of operators) {
    // この事業者に属する路線を抽出
    const operatorLines = lines.filter(
      (line) => line.operatorId === operator.id,
    );

    // 路線が存在する場合のみグループに追加
    if (operatorLines.length > 0) {
      groups.push({
        operator,
        lines: operatorLines,
      });
    }
  }

  return groups;
}
