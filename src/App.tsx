import { useState, useEffect, useMemo } from "react";
import type { Station, SearchCondition, Line } from "./types";
import type { ReachableStation } from "./types/ReachableStation";
import { StationSelector } from "./components/StationSelector";
import { ConditionPanel } from "./components/ConditionPanel";
import { MapComponent } from "./components/MapComponent";
import { loadStations, loadLines } from "./services/dataLoader";
import { buildGraph } from "./services/graphService";
import { findReachableStations } from "./services/reachabilityEngine";
import { generateRouteOverlays } from "./utils/routeOverlay";
import "./App.css";

function App() {
  const [stations, setStations] = useState<Station[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
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
        const [stationsData, linesData] = await Promise.all([
          loadStations(),
          loadLines(),
        ]);
        setStations(stationsData);
        setLines(linesData);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "路線データを取得できませんでした。再度お試しください",
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

  // グラフを構築（メモ化）
  const graph = useMemo(() => {
    if (stations.length === 0 || lines.length === 0) {
      return null;
    }
    return buildGraph(stations, lines);
  }, [stations, lines]);

  // 到達可能駅を算出（メモ化）
  const reachableStations = useMemo<ReachableStation[]>(() => {
    if (!selectedStation || !graph) {
      return [];
    }

    try {
      return findReachableStations(graph, selectedStation.id, searchCondition);
    } catch (err) {
      console.error("到達可能範囲の算出に失敗しました:", err);
      return [];
    }
  }, [selectedStation, searchCondition, graph]);

  // 路線オーバーレイを生成（メモ化）
  const routeOverlays = useMemo(() => {
    if (lines.length === 0) {
      return [];
    }
    return generateRouteOverlays(lines, reachableStations);
  }, [lines, reachableStations]);

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
          <MapComponent
            center={mapCenter}
            departureStation={selectedStation}
            reachableStations={reachableStations}
            maxTravelTime={searchCondition.maxTravelTime}
            routeOverlays={routeOverlays}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
