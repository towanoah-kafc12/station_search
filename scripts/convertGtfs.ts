/**
 * GTFSデータをアプリケーション用JSONに変換するスクリプト
 *
 * TokyoGTFSで生成した首都圏全路線のGTFSファイルを読み込み、
 * アプリケーション用の静的JSONファイルに変換する。
 *
 * 入力: data/gtfs/ ディレクトリ内のGTFSファイル群
 * 出力: public/data/ ディレクトリ内のJSONファイル群
 *   - stations.json: 駅データ
 *   - lines.json: 路線データ（segments含む）
 *   - operators.json: 事業者データ
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 型定義 ---

interface Station {
  id: string;
  name: string;
  nameKana: string;
  lat: number;
  lng: number;
  lineIds: string[];
  operatorId: string;
}

interface LineSegment {
  fromStationId: string;
  toStationId: string;
  travelTime: number;
  coordinates: [number, number][];
}

interface Line {
  id: string;
  name: string;
  operatorId: string;
  color: string;
  stationIds: string[];
  segments: LineSegment[];
}

interface Operator {
  id: string;
  name: string;
  lineIds: string[];
}

// --- CSVパーサー（ストリーミング対応） ---

/** CSVファイルを1行ずつ読み込み、各行をオブジェクトとして返す */
async function parseCSVStream(
  filePath: string,
  onRow: (row: Record<string, string>) => void,
): Promise<void> {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });

  let headers: string[] | null = null;

  for await (const line of rl) {
    if (!headers) {
      headers = parseCSVLine(line);
      continue;
    }
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = values[i] || "";
    }
    onRow(row);
  }
}

/** CSV行をパース（引用符対応） */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

// --- 時刻ユーティリティ ---

/** 時刻文字列（HH:MM:SS）を分に変換 */
function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

// --- メイン変換処理 ---

async function convertGtfs(): Promise<void> {
  const gtfsDir = path.join(__dirname, "..", "data", "gtfs");
  const outputDir = path.join(__dirname, "..", "public", "data");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (!fs.existsSync(path.join(gtfsDir, "stops.txt"))) {
    console.error("GTFSファイルが見つかりません: data/gtfs/stops.txt");
    console.error(
      "TokyoGTFSでGTFSデータを生成し、data/gtfs/に配置してください。",
    );
    process.exit(1);
  }

  console.log("GTFSデータの変換を開始します...");
  console.log(`入力: ${gtfsDir}`);
  console.log(`出力: ${outputDir}`);

  // ========================================
  // 1. agency.txt → 事業者マップ
  // ========================================
  console.log("\n[1/6] agency.txt を読み込み中...");
  const agencyMap = new Map<string, { id: string; name: string }>();

  await parseCSVStream(path.join(gtfsDir, "agency.txt"), (row) => {
    const name = row.agency_name.split(" ")[0]; // 日本語名のみ取得
    agencyMap.set(row.agency_id, { id: row.agency_id, name });
  });
  console.log(`  → ${agencyMap.size} 事業者`);

  // ========================================
  // 2. stops.txt → 駅データ
  // ========================================
  console.log("[2/6] stops.txt を読み込み中...");

  // parent駅（location_type=1）と子駅（location_type=0）を分けて管理
  const parentStations = new Map<string, Station>();
  // 子stop_id → 親station_id のマッピング
  const stopToStation = new Map<string, string>();

  await parseCSVStream(path.join(gtfsDir, "stops.txt"), (row) => {
    const locationType = parseInt(row.location_type || "0", 10);
    const stopName = row.stop_name.split(" ")[0]; // 日本語名のみ

    if (locationType === 1) {
      // 親駅
      parentStations.set(row.stop_id, {
        id: row.stop_id,
        name: stopName,
        nameKana: stopName, // GTFSにかな情報なし
        lat: parseFloat(row.stop_lat),
        lng: parseFloat(row.stop_lon),
        lineIds: [],
        operatorId: "",
      });
    } else if (locationType === 0) {
      // 子駅 → 親駅へマッピング
      const parentId = row.parent_station || row.stop_id;
      stopToStation.set(row.stop_id, parentId);

      // parent_stationが空の場合、この子駅自体を親駅として登録
      if (!row.parent_station && !parentStations.has(row.stop_id)) {
        parentStations.set(row.stop_id, {
          id: row.stop_id,
          name: stopName,
          nameKana: stopName,
          lat: parseFloat(row.stop_lat),
          lng: parseFloat(row.stop_lon),
          lineIds: [],
          operatorId: "",
        });
      }
    }
  });
  console.log(
    `  → ${parentStations.size} 駅（正規化済み）, ${stopToStation.size} 子駅`,
  );

  // ========================================
  // 3. routes.txt → 路線データ
  // ========================================
  console.log("[3/6] routes.txt を読み込み中...");

  const routeMap = new Map<
    string,
    { id: string; name: string; operatorId: string; color: string }
  >();

  await parseCSVStream(path.join(gtfsDir, "routes.txt"), (row) => {
    const name = row.route_long_name.split(" ")[0]; // 日本語名のみ
    const color = row.route_color ? `#${row.route_color}` : "#888888";
    routeMap.set(row.route_id, {
      id: row.route_id,
      name,
      operatorId: row.agency_id,
      color,
    });
  });
  console.log(`  → ${routeMap.size} 路線`);

  // ========================================
  // 4. trips.txt → trip_id → route_id マッピング
  // ========================================
  console.log("[4/6] trips.txt を読み込み中...");

  const tripToRoute = new Map<string, string>();

  await parseCSVStream(path.join(gtfsDir, "trips.txt"), (row) => {
    tripToRoute.set(row.trip_id, row.route_id);
  });
  console.log(`  → ${tripToRoute.size} trips`);

  // ========================================
  // 5. stop_times.txt → 駅間所要時間の算出
  // ========================================
  console.log(
    "[5/6] stop_times.txt を読み込み中（大容量ファイル、しばらくお待ちください）...",
  );

  // route_id → { fromStationId-toStationId → travelTime[] }
  const routeSegmentTimes = new Map<string, Map<string, number[]>>();
  // route_id → Set<stationId>（駅の出現順序を記録）
  const routeStationOrder = new Map<string, Map<string, number>>();

  // trip単位で前の停車駅を記録
  let prevTripId = "";
  let prevStopId = "";
  let prevDepartureTime = "";
  let prevStopSeq = -1;
  let processedLines = 0;

  await parseCSVStream(path.join(gtfsDir, "stop_times.txt"), (row) => {
    processedLines++;
    if (processedLines % 500000 === 0) {
      console.log(`  ... ${(processedLines / 1000000).toFixed(1)}M 行処理済み`);
    }

    const tripId = row.trip_id;
    const stopId = row.stop_id;
    const stopSeq = parseInt(row.stop_sequence, 10);
    const routeId = tripToRoute.get(tripId);

    if (!routeId) return;

    // 親駅IDに正規化
    const stationId = stopToStation.get(stopId) || stopId;

    // 路線ごとの駅順序を記録
    if (!routeStationOrder.has(routeId)) {
      routeStationOrder.set(routeId, new Map());
    }
    const stationOrder = routeStationOrder.get(routeId)!;
    if (!stationOrder.has(stationId)) {
      stationOrder.set(stationId, stationOrder.size);
    }

    // 同一tripの連続する停車駅間の所要時間を計算
    if (tripId === prevTripId && stopSeq === prevStopSeq + 1) {
      const fromStation = stopToStation.get(prevStopId) || prevStopId;
      const toStation = stationId;

      if (fromStation !== toStation) {
        const departTime = timeToMinutes(prevDepartureTime);
        const arriveTime = timeToMinutes(row.arrival_time);
        const travelTime = arriveTime - departTime;

        if (travelTime > 0 && travelTime < 120) {
          if (!routeSegmentTimes.has(routeId)) {
            routeSegmentTimes.set(routeId, new Map());
          }
          const segments = routeSegmentTimes.get(routeId)!;
          // 双方向を正規化（小さいID → 大きいID）
          const key =
            fromStation < toStation
              ? `${fromStation}-${toStation}`
              : `${toStation}-${fromStation}`;
          const [normalFrom, normalTo] =
            fromStation < toStation
              ? [fromStation, toStation]
              : [toStation, fromStation];

          if (!segments.has(key)) {
            segments.set(key, []);
          }
          segments.get(key)!.push(travelTime);
        }
      }
    }

    prevTripId = tripId;
    prevStopId = stopId;
    prevDepartureTime = row.departure_time;
    prevStopSeq = stopSeq;
  });

  console.log(`  → ${processedLines} 行処理完了`);

  // ========================================
  // 6. データの組み立てとJSON出力
  // ========================================
  console.log("[6/6] JSONファイルを生成中...");

  // 路線データの組み立て
  const lines: Line[] = [];
  const operatorLineIds = new Map<string, string[]>();

  for (const [routeId, routeInfo] of routeMap) {
    const segmentTimesMap = routeSegmentTimes.get(routeId);
    if (!segmentTimesMap || segmentTimesMap.size === 0) continue;

    const segments: LineSegment[] = [];
    const stationIdSet = new Set<string>();

    for (const [key, times] of segmentTimesMap) {
      const [fromId, toId] = key.split("-");
      // 中央値を計算
      times.sort((a, b) => a - b);
      const median = times[Math.floor(times.length / 2)];

      stationIdSet.add(fromId);
      stationIdSet.add(toId);

      const fromStation = parentStations.get(fromId);
      const toStation = parentStations.get(toId);

      segments.push({
        fromStationId: fromId,
        toStationId: toId,
        travelTime: median,
        coordinates:
          fromStation && toStation
            ? [
                [fromStation.lng, fromStation.lat],
                [toStation.lng, toStation.lat],
              ]
            : [],
      });
    }

    // 駅順序でソート
    const stationOrder = routeStationOrder.get(routeId);
    const stationIds = Array.from(stationIdSet).sort((a, b) => {
      const orderA = stationOrder?.get(a) ?? Infinity;
      const orderB = stationOrder?.get(b) ?? Infinity;
      return orderA - orderB;
    });

    // 駅にlineIdとoperatorIdを設定
    for (const sid of stationIds) {
      const station = parentStations.get(sid);
      if (station) {
        if (!station.lineIds.includes(routeId)) {
          station.lineIds.push(routeId);
        }
        if (!station.operatorId) {
          station.operatorId = routeInfo.operatorId;
        }
      }
    }

    lines.push({
      id: routeId,
      name: routeInfo.name,
      operatorId: routeInfo.operatorId,
      color: routeInfo.color,
      stationIds,
      segments,
    });

    // 事業者ごとの路線IDを記録
    if (!operatorLineIds.has(routeInfo.operatorId)) {
      operatorLineIds.set(routeInfo.operatorId, []);
    }
    operatorLineIds.get(routeInfo.operatorId)!.push(routeId);
  }

  // 路線に所属する駅のみをフィルタ
  const usedStationIds = new Set<string>();
  for (const line of lines) {
    for (const sid of line.stationIds) {
      usedStationIds.add(sid);
    }
  }

  const stations = Array.from(parentStations.values())
    .filter((s) => usedStationIds.has(s.id))
    .filter((s) => s.lineIds.length > 0);

  // 事業者データの組み立て
  const operators: Operator[] = [];
  for (const [agencyId, agencyInfo] of agencyMap) {
    const lineIds = operatorLineIds.get(agencyId);
    if (lineIds && lineIds.length > 0) {
      operators.push({
        id: agencyId,
        name: agencyInfo.name,
        lineIds,
      });
    }
  }

  // JSON出力
  fs.writeFileSync(
    path.join(outputDir, "stations.json"),
    JSON.stringify(stations, null, 2),
  );
  console.log(`\n✓ stations.json を生成しました (${stations.length} 駅)`);

  fs.writeFileSync(
    path.join(outputDir, "lines.json"),
    JSON.stringify(lines, null, 2),
  );
  console.log(`✓ lines.json を生成しました (${lines.length} 路線)`);

  fs.writeFileSync(
    path.join(outputDir, "operators.json"),
    JSON.stringify(operators, null, 2),
  );
  console.log(`✓ operators.json を生成しました (${operators.length} 事業者)`);

  // サマリー
  const totalSegments = lines.reduce((sum, l) => sum + l.segments.length, 0);
  console.log(`\n=== 変換完了 ===`);
  console.log(`駅数: ${stations.length}`);
  console.log(`路線数: ${lines.length}`);
  console.log(`事業者数: ${operators.length}`);
  console.log(`区間数: ${totalSegments}`);
}

// スクリプト実行
convertGtfs().catch((err) => {
  console.error("変換エラー:", err);
  process.exit(1);
});
