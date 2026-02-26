import { useState } from "react";
import type { Station, SearchCondition } from "./types";
import "./App.css";

function App() {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [searchCondition, setSearchCondition] = useState<SearchCondition>({
    maxTravelTime: 30,
    maxTransfers: 2,
    excludedLines: [],
  });

  return (
    <div className="app">
      <header className="app-header">
        <h1>駅到達可能範囲マップ</h1>
      </header>
      <main className="app-main">
        <div className="sidebar">
          <p>駅セレクターと条件パネルをここに配置予定</p>
          <p>選択された駅: {selectedStation?.name || "未選択"}</p>
          <p>最大移動時間: {searchCondition.maxTravelTime}分</p>
          <p>最大乗り換え回数: {searchCondition.maxTransfers}回</p>
        </div>
        <div className="map-container">
          <p>地図コンポーネントをここに配置予定</p>
        </div>
      </main>
    </div>
  );
}

export default App;
