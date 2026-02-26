/**
 * 駅セレクターコンポーネント
 * 出発駅の検索・選択を担当
 */

import { useState, useEffect } from "react";
import type { Station } from "../types";
import { filterStations } from "../utils/filterStations";
import "./StationSelector.css";

interface StationSelectorProps {
  stations: Station[];
  onStationSelect: (station: Station) => void;
  selectedStation: Station | null;
}

export function StationSelector({
  stations,
  onStationSelect,
  selectedStation,
}: StationSelectorProps) {
  const [query, setQuery] = useState("");
  const [filteredStations, setFilteredStations] = useState<Station[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (query.trim() === "") {
      setFilteredStations([]);
      setShowDropdown(false);
      return;
    }

    const results = filterStations(stations, query);
    setFilteredStations(results);
    setShowDropdown(true);
  }, [query, stations]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleStationClick = (station: Station) => {
    onStationSelect(station);
    setQuery(station.name);
    setShowDropdown(false);
  };

  const handleInputFocus = () => {
    if (filteredStations.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleInputBlur = () => {
    // ドロップダウンのクリックを処理するため、少し遅延させる
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  return (
    <div className="station-selector">
      <label htmlFor="station-input" className="station-selector-label">
        出発駅を選択
      </label>
      <div className="station-selector-input-wrapper">
        <input
          id="station-input"
          type="text"
          className="station-selector-input"
          placeholder="駅名を入力してください"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
        {showDropdown && (
          <div className="station-selector-dropdown">
            {filteredStations.length > 0 ? (
              <ul className="station-selector-list">
                {filteredStations.map((station) => (
                  <li
                    key={station.id}
                    className="station-selector-item"
                    onClick={() => handleStationClick(station)}
                  >
                    <span className="station-name">{station.name}</span>
                    <span className="station-kana">{station.nameKana}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="station-selector-no-results">
                該当する駅が見つかりません
              </div>
            )}
          </div>
        )}
      </div>
      {selectedStation && (
        <div className="station-selector-selected">
          選択中: {selectedStation.name}
        </div>
      )}
    </div>
  );
}
