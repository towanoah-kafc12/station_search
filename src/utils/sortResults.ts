/**
 * sortResults - 到達可能駅のソート関数
 */

import type { ReachableStation } from "../types/ReachableStation";

export type SortKey = "travelTime" | "transfers" | "stationName" | "lineName";
export type SortOrder = "asc" | "desc";

/**
 * 到達可能駅のリストをソートする
 * @param results ソート対象の到達可能駅リスト
 * @param key ソートキー
 * @param order ソート順序（昇順/降順）
 * @returns ソート済みの到達可能駅リスト
 */
export function sortResults(
  results: ReachableStation[],
  key: SortKey,
  order: SortOrder,
): ReachableStation[] {
  const sorted = [...results].sort((a, b) => {
    let comparison = 0;

    switch (key) {
      case "travelTime":
        comparison = a.travelTime - b.travelTime;
        break;
      case "transfers":
        comparison = a.transfers - b.transfers;
        break;
      case "stationName":
        comparison = a.station.name.localeCompare(b.station.name, "ja");
        break;
      case "lineName": {
        // 最初の路線名で比較（複数路線がある場合は最初のもの）
        const aLineName = a.route.length > 0 ? a.route[0].lineId : "";
        const bLineName = b.route.length > 0 ? b.route[0].lineId : "";
        comparison = aLineName.localeCompare(bLineName, "ja");
        break;
      }
    }

    return order === "asc" ? comparison : -comparison;
  });

  return sorted;
}
