/**
 * GTFSデータをアプリケーション用JSONに変換するスクリプト
 *
 * 入力: data/gtfs/ ディレクトリ内のGTFSファイル群
 * 出力: public/data/ ディレクトリ内のJSONファイル群
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface GtfsStop {
  stop_id: string;
  stop_name: string;
  stop_lat: string;
  stop_lon: string;
  parent_station?: string;
}

interface GtfsRoute {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_color?: string;
  agency_id: string;
}

interface GtfsAgency {
  agency_id: string;
  agency_name: string;
}

interface GtfsTrip {
  trip_id: string;
  route_id: string;
  service_id: string;
}

interface GtfsStopTime {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: string;
}

// CSVパーサー（簡易版）
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split("\n");
  if (lines.length === 0) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const result: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    result.push(row);
  }

  return result;
}

// 時刻文字列（HH:MM:SS）を分に変換
function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

// 駅間所要時間を算出（中央値）
function calculateTravelTimes(
  stopTimes: GtfsStopTime[],
  trips: GtfsTrip[],
): Map<string, number> {
  const travelTimeMap = new Map<string, number[]>();

  // trip_idごとにstop_timesをグループ化
  const tripStopTimes = new Map<string, GtfsStopTime[]>();
  stopTimes.forEach((st) => {
    if (!tripStopTimes.has(st.trip_id)) {
      tripStopTimes.set(st.trip_id, []);
    }
    tripStopTimes.get(st.trip_id)!.push(st);
  });

  // 各tripで隣接駅間の所要時間を計算
  tripStopTimes.forEach((stops, tripId) => {
    stops.sort((a, b) => parseInt(a.stop_sequence) - parseInt(b.stop_sequence));

    for (let i = 0; i < stops.length - 1; i++) {
      const from = stops[i];
      const to = stops[i + 1];

      const departTime = timeToMinutes(from.departure_time);
      const arriveTime = timeToMinutes(to.arrival_time);
      const travelTime = arriveTime - departTime;

      if (travelTime > 0 && travelTime < 120) {
        // 妥当な範囲のみ
        const key = `${from.stop_id}-${to.stop_id}`;
        if (!travelTimeMap.has(key)) {
          travelTimeMap.set(key, []);
        }
        travelTimeMap.get(key)!.push(travelTime);
      }
    }
  });

  // 中央値を計算
  const result = new Map<string, number>();
  travelTimeMap.forEach((times, key) => {
    times.sort((a, b) => a - b);
    const median = times[Math.floor(times.length / 2)];
    result.set(key, median);
  });

  return result;
}

async function convertGtfs() {
  const gtfsDir = path.join(__dirname, "..", "data", "gtfs");
  const outputDir = path.join(__dirname, "..", "public", "data");

  // 出力ディレクトリを作成
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("GTFSデータの変換を開始します...");

  // GTFSファイルが存在しない場合はダミーデータを生成
  if (!fs.existsSync(gtfsDir)) {
    console.log("GTFSディレクトリが見つかりません。ダミーデータを生成します。");
    generateDummyData(outputDir);
    return;
  }

  // stops.txt を読み込み
  const stopsPath = path.join(gtfsDir, "stops.txt");
  if (!fs.existsSync(stopsPath)) {
    console.log("stops.txtが見つかりません。ダミーデータを生成します。");
    generateDummyData(outputDir);
    return;
  }

  const stopsContent = fs.readFileSync(stopsPath, "utf-8");
  const gtfsStops = parseCSV(stopsContent) as unknown as GtfsStop[];

  // parent_stationで駅を正規化
  const stationMap = new Map<string, any>();
  gtfsStops.forEach((stop) => {
    const stationId = stop.parent_station || stop.stop_id;
    if (!stationMap.has(stationId)) {
      stationMap.set(stationId, {
        id: stationId,
        name: stop.stop_name,
        nameKana: stop.stop_name, // GTFSにはかな情報がないため同じ値を使用
        lat: parseFloat(stop.stop_lat),
        lng: parseFloat(stop.stop_lon),
        lineIds: [],
        operatorId: "unknown",
      });
    }
  });

  const stations = Array.from(stationMap.values());

  // stations.jsonを出力
  fs.writeFileSync(
    path.join(outputDir, "stations.json"),
    JSON.stringify(stations, null, 2),
  );
  console.log(`✓ stations.json を生成しました (${stations.length}駅)`);

  // 簡易的なlines.jsonとoperators.jsonを生成
  const lines = [];
  const operators = [{ id: "unknown", name: "不明", lineIds: [] }];

  fs.writeFileSync(
    path.join(outputDir, "lines.json"),
    JSON.stringify(lines, null, 2),
  );
  console.log(`✓ lines.json を生成しました`);

  fs.writeFileSync(
    path.join(outputDir, "operators.json"),
    JSON.stringify(operators, null, 2),
  );
  console.log(`✓ operators.json を生成しました`);

  console.log("変換が完了しました！");
}

// ダミーデータ生成（開発用）
function generateDummyData(outputDir: string) {
  console.log("開発用ダミーデータを生成します...");

  // JR山手線の主要駅のダミーデータ
  const dummyStations = [
    {
      id: "tokyo",
      name: "東京",
      nameKana: "とうきょう",
      lat: 35.6812,
      lng: 139.7671,
      lineIds: ["yamanote"],
      operatorId: "JR_East",
    },
    {
      id: "yurakucho",
      name: "有楽町",
      nameKana: "ゆうらくちょう",
      lat: 35.6751,
      lng: 139.763,
      lineIds: ["yamanote"],
      operatorId: "JR_East",
    },
    {
      id: "shimbashi",
      name: "新橋",
      nameKana: "しんばし",
      lat: 35.6658,
      lng: 139.7576,
      lineIds: ["yamanote"],
      operatorId: "JR_East",
    },
    {
      id: "shibuya",
      name: "渋谷",
      nameKana: "しぶや",
      lat: 35.658,
      lng: 139.7016,
      lineIds: ["yamanote"],
      operatorId: "JR_East",
    },
    {
      id: "shinjuku",
      name: "新宿",
      nameKana: "しんじゅく",
      lat: 35.6896,
      lng: 139.7006,
      lineIds: ["yamanote"],
      operatorId: "JR_East",
    },
    {
      id: "ikebukuro",
      name: "池袋",
      nameKana: "いけぶくろ",
      lat: 35.7295,
      lng: 139.7109,
      lineIds: ["yamanote"],
      operatorId: "JR_East",
    },
  ];

  const dummyLines = [
    {
      id: "yamanote",
      name: "山手線",
      operatorId: "JR_East",
      color: "#9ACD32",
      stationIds: [
        "tokyo",
        "yurakucho",
        "shimbashi",
        "shibuya",
        "shinjuku",
        "ikebukuro",
      ],
      segments: [
        {
          fromStationId: "tokyo",
          toStationId: "yurakucho",
          travelTime: 2,
          coordinates: [
            [139.7671, 35.6812],
            [139.763, 35.6751],
          ],
        },
        {
          fromStationId: "yurakucho",
          toStationId: "shimbashi",
          travelTime: 2,
          coordinates: [
            [139.763, 35.6751],
            [139.7576, 35.6658],
          ],
        },
        {
          fromStationId: "shimbashi",
          toStationId: "shibuya",
          travelTime: 15,
          coordinates: [
            [139.7576, 35.6658],
            [139.7016, 35.658],
          ],
        },
        {
          fromStationId: "shibuya",
          toStationId: "shinjuku",
          travelTime: 7,
          coordinates: [
            [139.7016, 35.658],
            [139.7006, 35.6896],
          ],
        },
        {
          fromStationId: "shinjuku",
          toStationId: "ikebukuro",
          travelTime: 5,
          coordinates: [
            [139.7006, 35.6896],
            [139.7109, 35.7295],
          ],
        },
      ],
    },
  ];

  const dummyOperators = [
    { id: "JR_East", name: "JR東日本", lineIds: ["yamanote"] },
  ];

  fs.writeFileSync(
    path.join(outputDir, "stations.json"),
    JSON.stringify(dummyStations, null, 2),
  );
  console.log(`✓ stations.json を生成しました (${dummyStations.length}駅)`);

  fs.writeFileSync(
    path.join(outputDir, "lines.json"),
    JSON.stringify(dummyLines, null, 2),
  );
  console.log(`✓ lines.json を生成しました (${dummyLines.length}路線)`);

  fs.writeFileSync(
    path.join(outputDir, "operators.json"),
    JSON.stringify(dummyOperators, null, 2),
  );
  console.log(
    `✓ operators.json を生成しました (${dummyOperators.length}事業者)`,
  );

  console.log("ダミーデータの生成が完了しました！");
}

// スクリプト実行
convertGtfs().catch(console.error);
