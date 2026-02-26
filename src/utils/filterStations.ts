/**
 * 駅名フィルタリング関数
 * 漢字・かな部分一致検索を実装
 */

import type { Station } from "../types";

/**
 * 駅名の部分一致フィルタリング
 * @param stations 駅データの配列
 * @param query 検索文字列
 * @returns フィルタリングされた駅の配列
 */
export function filterStations(stations: Station[], query: string): Station[] {
  if (!query || query.trim() === "") {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();

  return stations.filter((station) => {
    // 駅名（漢字）での部分一致
    const nameMatch = station.name.toLowerCase().includes(normalizedQuery);

    // 駅名かなでの部分一致
    const kanaMatch = station.nameKana.toLowerCase().includes(normalizedQuery);

    return nameMatch || kanaMatch;
  });
}
