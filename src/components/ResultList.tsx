/**
 * ResultList - 検索結果一覧コンポーネント
 * 到達可能駅をリスト形式で表示し、ソート機能を提供する
 */

import { useState } from "react";
import type { ReachableStation } from "../types/ReachableStation";
import type { Line } from "../types/Line";
import {
  sortResults,
  type SortKey,
  type SortOrder,
} from "../utils/sortResults";
import "./ResultList.css";

interface ResultListProps {
  results: ReachableStation[];
  lines: Line[];
  onStationClick: (station: ReachableStation) => void;
}

export function ResultList({
  results,
  lines,
  onStationClick,
}: ResultListProps) {
  const [sortKey, setSortKey] = useState<SortKey>("travelTime");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // 路線IDから路線名を取得するヘルパー関数
  const getLineName = (lineId: string): string => {
    const line = lines.find((l) => l.id === lineId);
    return line ? line.name : lineId;
  };

  // ソート条件変更ハンドラー
  const handleSortChange = (key: SortKey) => {
    if (sortKey === key) {
      // 同じキーの場合は順序を反転
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // 異なるキーの場合は昇順にリセット
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  // ソート済みの結果を取得
  const sortedResults = sortResults(results, sortKey, sortOrder);

  // ソートアイコンを取得
  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return "⇅";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  if (results.length === 0) {
    return (
      <div className="result-list">
        <div className="result-list-empty">
          条件に合う駅が見つかりませんでした
        </div>
      </div>
    );
  }

  return (
    <div className="result-list">
      <div className="result-list-header">
        <h2>到達可能な駅（{results.length}件）</h2>
      </div>
      <div className="result-list-controls">
        <button
          className={`sort-button ${sortKey === "travelTime" ? "active" : ""}`}
          onClick={() => handleSortChange("travelTime")}
        >
          移動時間 {getSortIcon("travelTime")}
        </button>
        <button
          className={`sort-button ${sortKey === "transfers" ? "active" : ""}`}
          onClick={() => handleSortChange("transfers")}
        >
          乗り換え {getSortIcon("transfers")}
        </button>
        <button
          className={`sort-button ${sortKey === "stationName" ? "active" : ""}`}
          onClick={() => handleSortChange("stationName")}
        >
          駅名 {getSortIcon("stationName")}
        </button>
        <button
          className={`sort-button ${sortKey === "lineName" ? "active" : ""}`}
          onClick={() => handleSortChange("lineName")}
        >
          路線 {getSortIcon("lineName")}
        </button>
      </div>
      <div className="result-list-items">
        {sortedResults.map((result) => {
          // 使用路線を取得（重複を除く）
          const usedLines = Array.from(
            new Set(result.route.map((step) => step.lineId)),
          );
          const lineNames = usedLines.map(getLineName).join("、");

          return (
            <div
              key={result.station.id}
              className="result-item"
              onClick={() => onStationClick(result)}
            >
              <div className="result-item-main">
                <div className="result-item-station">{result.station.name}</div>
                <div className="result-item-details">
                  <span className="result-item-time">
                    {result.travelTime}分
                  </span>
                  <span className="result-item-transfers">
                    乗り換え{result.transfers}回
                  </span>
                </div>
              </div>
              <div className="result-item-lines">{lineNames}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
