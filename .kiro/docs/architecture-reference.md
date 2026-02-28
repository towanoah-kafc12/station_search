# アーキテクチャリファレンス

前回の実装で確立したアーキテクチャの知見。次回の設計の出発点として使用する。

## レイヤー構成

```
┌─────────────────────────────────────────────┐
│  UI Layer (React Components)                │
│  StationSelector / ConditionPanel /         │
│  MapComponent / ResultList                  │
├─────────────────────────────────────────────┤
│  Logic Layer (Pure Functions)               │
│  ReachabilityEngine / GraphService          │
├─────────────────────────────────────────────┤
│  Data Layer (Static JSON via fetch)         │
│  stations.json / lines.json / operators.json│
└─────────────────────────────────────────────┘
         ↑ ビルド時に生成
┌─────────────────────────────────────────────┐
│  Build-time Pipeline                        │
│  scripts/convertGtfs.ts                     │
│  GTFS files → Application JSON             │
└─────────────────────────────────────────────┘
```

## データフロー

1. ビルド時: GTFS → convertGtfs.ts → public/data/\*.json
2. ランタイム: fetch で JSON 読み込み → グラフ構築 → 探索 → 表示

API呼び出しは一切発生しない。完全オフライン動作。

## 型定義（前回の実装で確定したもの）

### Station（駅）

```typescript
interface Station {
  id: string; // 一意の駅ID（parent_station または stop_id）
  name: string; // 駅名（日本語）
  nameKana: string; // 駅名かな
  lat: number; // 緯度
  lng: number; // 経度
  lineIds: string[]; // 所属路線IDリスト
  operatorId: string; // 事業者ID
}
```

### Line（路線）

```typescript
interface Line {
  id: string; // 路線ID
  name: string; // 路線名（日本語）
  operatorId: string; // 事業者ID
  color: string; // 路線カラー（#RRGGBB）
  stationIds: string[]; // 駅IDリスト（順序付き）
  segments: LineSegment[];
}

interface LineSegment {
  fromStationId: string;
  toStationId: string;
  travelTime: number; // 所要時間（分）
  coordinates: [number, number][]; // 経路座標（ポリライン描画用）
}
```

### Operator（事業者）

```typescript
interface Operator {
  id: string; // 事業者ID
  name: string; // 事業者名（日本語）
  lineIds: string[]; // 運営路線IDリスト
}
```

### SearchCondition（検索条件）

```typescript
interface SearchCondition {
  maxTravelTime: number; // 5〜120分
  maxTransfers: number; // 0〜5回
  excludedLines: string[]; // 除外路線ID
}
```

### ReachableStation（到達可能駅）

```typescript
interface ReachableStation {
  station: Station;
  travelTime: number; // 出発駅からの移動時間（分）
  transfers: number; // 乗り換え回数
  route: RouteStep[]; // 経路詳細
}

interface RouteStep {
  lineId: string;
  fromStationId: string;
  toStationId: string;
  travelTime: number;
}
```

## グラフ構造（graphology）

```typescript
// グラフ設定
const graph = new Graph<NodeAttributes, EdgeAttributes>({
  type: "directed",
  multi: true, // 同じ駅間に複数路線を許容
});

// ノード属性
interface NodeAttributes {
  station: Station;
}

// エッジ属性
interface EdgeAttributes {
  lineId: string;
  travelTime: number;
  requiresTransfer: boolean;
}
```

### 探索アルゴリズム

- 単一始点全到達可能駅探索（Dijkstra変形）
- 制約: maxTravelTime, maxTransfers, excludedLines
- 探索キューの各エントリに currentLineId を持たせ、路線変更で乗り換えを検出
- 乗り換え時間: 固定5分（将来は駅別に精緻化）

### 前回の改善すべき点

1. 優先度付きキューを配列ソートで代用していた → ヒープに置き換える
2. visited を stationId のみで管理 → (stationId, currentLineId) ペアにすべき
3. addTransferEdges が空実装だった → 乗り換えモデルの再設計が必要

## 依存パッケージ（参考）

```json
{
  "dependencies": {
    "graphology": "^0.25.4",
    "graphology-shortest-path": "^2.0.2",
    "leaflet": "^1.9.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-leaflet": "^4.2.1"
  },
  "devDependencies": {
    "@fast-check/vitest": "^0.2.4",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@types/leaflet": "^1.9.8",
    "@types/node": "^22.10.5",
    "fast-check": "^3.23.1",
    "jsdom": "^28.1.0",
    "tsx": "^4.21.0",
    "vitest": "^2.1.8"
  }
}
```

## ディレクトリ構成（前回）

```
src/
├── components/
│   ├── StationSelector.tsx   # 駅検索・選択
│   ├── ConditionPanel.tsx    # 条件入力・路線フィルタ
│   ├── MapComponent.tsx      # Leaflet地図
│   └── ResultList.tsx        # 到達可能駅一覧
├── services/
│   ├── dataLoader.ts         # JSON読み込み
│   ├── graphService.ts       # グラフ構築
│   └── reachabilityEngine.ts # 到達可能範囲算出
├── types/
│   ├── index.ts              # re-export
│   ├── Station.ts
│   ├── Line.ts
│   ├── Operator.ts
│   ├── SearchCondition.ts
│   ├── ReachableStation.ts
│   ├── RouteOverlay.ts
│   ├── Isochrone.ts
│   └── ValidationResult.ts
├── utils/
│   ├── colorScale.ts         # 移動時間→色変換
│   ├── filterStations.ts     # 駅名フィルタリング
│   ├── groupLinesByOperator.ts
│   ├── isochrone.ts          # 等時線ポリゴン生成
│   ├── routeOverlay.ts       # 路線オーバーレイ生成
│   ├── sortResults.ts        # 結果ソート
│   └── validateCondition.ts  # 条件バリデーション
├── App.tsx
├── App.css
└── main.tsx
scripts/
└── convertGtfs.ts            # GTFS→JSON変換
public/data/
├── stations.json
├── lines.json
└── operators.json
```
