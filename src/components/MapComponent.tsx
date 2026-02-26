/**
 * 地図コンポーネント
 * Leaflet + react-leaflet で地図を表示
 */

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  CircleMarker,
  Polyline,
} from "react-leaflet";
import type { Station } from "../types";
import type { ReachableStation } from "../types/ReachableStation";
import type { RouteOverlay } from "../types/RouteOverlay";
import { getTravelTimeColorHex } from "../utils/colorScale";
import "leaflet/dist/leaflet.css";
import "./MapComponent.css";

// Leafletのデフォルトアイコンの問題を修正
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentProps {
  center: [number, number]; // 地図中心座標
  departureStation: Station | null;
  reachableStations: ReachableStation[]; // 到達可能駅リスト
  maxTravelTime: number; // 最大移動時間（色分けに使用）
  routeOverlays: RouteOverlay[]; // 路線オーバーレイ
}

// 地図の中心を更新し、到達可能駅が全て表示されるようズームレベルを調整するコンポーネント
function MapUpdater({
  center,
  reachableStations,
  departureStation,
}: {
  center: [number, number];
  reachableStations: ReachableStation[];
  departureStation: Station | null;
}) {
  const map = useMap();

  useEffect(() => {
    // 到達可能駅がある場合は、全ての駅が表示されるようバウンディングボックスを計算
    if (reachableStations.length > 0 && departureStation) {
      const allStations = [
        departureStation,
        ...reachableStations.map((r) => r.station),
      ];

      const lats = allStations.map((s) => s.lat);
      const lngs = allStations.map((s) => s.lng);

      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      // バウンディングボックスに合わせてズーム
      map.fitBounds(
        [
          [minLat, minLng],
          [maxLat, maxLng],
        ],
        {
          padding: [50, 50], // 余白を追加
        },
      );
    } else {
      // 到達可能駅がない場合は中心座標に移動
      map.setView(center, map.getZoom());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], reachableStations.length]);

  return null;
}

export function MapComponent({
  center,
  departureStation,
  reachableStations,
  maxTravelTime,
  routeOverlays,
}: MapComponentProps) {
  return (
    <div className="map-component">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater
          center={center}
          reachableStations={reachableStations}
          departureStation={departureStation}
        />
        {/* 路線オーバーレイ（駅マーカーより下に描画） */}
        {routeOverlays.map((overlay) => (
          <Polyline
            key={overlay.lineId}
            positions={overlay.coordinates}
            pathOptions={{
              color: overlay.color,
              weight: 3,
              opacity: overlay.isReachable ? 0.8 : 0.3, // 到達可能範囲外は薄く表示
            }}
          >
            <Popup>
              <div>
                <strong>{overlay.lineName}</strong>
              </div>
            </Popup>
          </Polyline>
        ))}
        {/* 出発駅マーカー */}
        {departureStation && (
          <Marker position={[departureStation.lat, departureStation.lng]}>
            <Popup>
              <div>
                <strong>{departureStation.name}</strong>
                <br />
                出発駅
              </div>
            </Popup>
          </Marker>
        )}
        {/* 到達可能駅マーカー */}
        {reachableStations.map((reachable) => {
          const color = getTravelTimeColorHex(
            reachable.travelTime,
            maxTravelTime,
          );
          return (
            <CircleMarker
              key={reachable.station.id}
              center={[reachable.station.lat, reachable.station.lng]}
              radius={8}
              pathOptions={{
                fillColor: color,
                fillOpacity: 0.7,
                color: "#000",
                weight: 1,
              }}
            >
              <Popup>
                <div>
                  <strong>{reachable.station.name}</strong>
                  <br />
                  移動時間: {reachable.travelTime}分
                  <br />
                  乗り換え: {reachable.transfers}回
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
