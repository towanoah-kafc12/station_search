// 検索条件の型定義
export interface SearchCondition {
  maxTravelTime: number; // 5〜120分
  maxTransfers: number; // 0〜5回
  excludedLines: string[]; // 除外路線ID（Phase 4）
}
