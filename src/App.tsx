import { useState, useEffect } from "react";
import type { Station, SearchCondition } from "./types";
import { StationSelector } from "./components/StationSelector";
import { ConditionPanel } from "./components/ConditionPanel";
import { MapComponent } from "./components/MapComponent";
import { loadStations } from "./services/dataLoader";
import "./App.css";

function App() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [searchCondition, setSearchCondition] = useState<SearchCondition>({
    maxTravelTime: 30,
    maxTransfers: 2,
    excludedLines: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初期データ読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const stationsData = await loadStations();
        setStations(stationsData);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "不明なエラーが発生しました",
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 駅選択時のハンドラー
  const handleStationSelect = (station: Station) => {
    setSelectedStation(station);
  };

  // 条件変更時のハンドラー
  const handleConditionChange = (condition: SearchCondition) => {
    setSearchCondition(condition);
  };

  // 地図の中心座標を計算
  const mapCenter: [number, number] = selectedStation
    ? [selectedStation.lat, selectedStation.lng]
    : [35.6812, 139.7671]; // デフォルトは東京駅

  if (loading) {
    return (
      <div className="app">
        <div className="app-loading">データを読み込んでいます...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="app-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>再読み込み</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>駅到達可能範囲マップ</h1>
      </header>
      <main className="app-main">
        <div className="sidebar">
          <StationSelector
            stations={stations}
            onStationSelect={handleStationSelect}
            selectedStation={selectedStation}
          />
          <ConditionPanel
            condition={searchCondition}
            onConditionChange={handleConditionChange}
          />
        </div>
        <div className="map-container">
          <MapComponent center={mapCenter} departureStation={selectedStation} />
        </div>
      </main>
    </div>
  );
}

export default App;
