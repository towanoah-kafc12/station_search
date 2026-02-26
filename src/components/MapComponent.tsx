/**
 * 地図コンポーネント
 * Leaflet + react-leaflet で地図を表示
 */

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import type { Station } from "../types";
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
}

// 地図の中心を更新するコンポーネント
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

export function MapComponent({ center, departureStation }: MapComponentProps) {
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
        <MapUpdater center={center} />
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
      </MapContainer>
    </div>
  );
}
