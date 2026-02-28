# 実装ノウハウ集: 駅到達可能範囲マップ v1

前回の実装（backup/phase-4-full-implementation）で得た知見をまとめる。
次回の設計・実装で同じ落とし穴を踏まないための参照資料。

## 1. データソース: TokyoGTFS

### 概要

- リポジトリ: https://github.com/MKuranowski/TokyoGTFS
- mini-tokyo-3d プロジェクトのデータをベースに、首都圏全都市鉄道のGTFSファイルを生成するPythonツール
- ライセンス: MIT License (Copyright (c) 2019-2025 Akihiko Kusanagi)
- 鉄道データの生成にAPIキーは不要（バスデータのみODPT APIキーが必要）

### GTFSファイル構造

| ファイル           | 内容                              | 主要フィールド                                                      |
| ------------------ | --------------------------------- | ------------------------------------------------------------------- |
| `stops.txt`        | 駅データ                          | stop_id, stop_name, stop_lat, stop_lon, parent_station              |
| `routes.txt`       | 路線データ                        | route_id, route_short_name, route_long_name, route_color, agency_id |
| `trips.txt`        | 運行データ                        | trip_id, route_id, service_id, block_id                             |
| `stop_times.txt`   | 時刻表データ（**115MB超、巨大**） | trip_id, arrival_time, departure_time, stop_id, stop_sequence       |
| `agency.txt`       | 事業者データ                      | agency_id, agency_name                                              |
| `calendar.txt`     | 運行日データ                      | service_id, monday〜sunday, start_date, end_date                    |
| `translations.txt` | 多言語翻訳                        | table_name, field_name, language, translation                       |

### 重要な知見

1. **stop_times.txt は115MB超** — GitHubの100MB制限に引っかかる。必ず `.gitignore` に `data/` を追加すること
2. **parent_station による駅の正規化が必須** — 同一駅でも路線ごとに異なる stop_id が割り当てられる。`parent_station` が設定されている場合はそれを駅IDとして使用し、同一駅を束ねる
3. **translations.txt に日本語駅名がある** — stops.txt の stop_name はローマ字表記の場合がある。translations.txt から `table_name=stops, field_name=stop_name, language=ja` で日本語名を取得する
4. **CSVパーサーはストリーミング対応が必須** — stop_times.txt が巨大なため、readline でストリーミング処理する。一括読み込みはメモリ不足になる
5. **駅間所要時間の算出** — stop_times.txt の隣接駅間の departure_time（前駅）と arrival_time（次駅）の差分を計算。同一区間の複数tripから中央値を採用する

### ODPT API との比較（採用しなかった理由）

| 観点           | ODPT API                           | TokyoGTFS                             |
| -------------- | ---------------------------------- | ------------------------------------- |
| データ形式     | 独自JSON（事業者ごとに癖あり）     | GTFS標準形式（全事業者統一）          |
| 駅間所要時間   | TrainTimetableから自前算出（複雑） | stop_times.txt の差分計算（シンプル） |
| APIキー        | 必須（開発者登録）                 | 鉄道データは不要                      |
| ランタイム依存 | あり                               | なし（静的JSON）                      |
| カバレッジ     | 事業者ごとに公開範囲が異なる       | 首都圏全都市鉄道                      |

## 2. グラフ探索アルゴリズム

### graphology の使い方

- `graphology` + `graphology-shortest-path` を使用
- グラフは `directed` + `multi: true`（同じ駅間に複数路線がある場合を許容）
- ノード属性: `{ station: Station }`
- エッジ属性: `{ lineId: string, travelTime: number, requiresTransfer: boolean }`
- 双方向エッジを明示的に追加する（往復可能にするため）

### Dijkstra 探索の実装

前回は `graphology-shortest-path` の Dijkstra をそのまま使わず、**自前の優先度付きキュー探索**を実装した。理由:

- 乗り換え回数の制約（maxTransfers）を探索中にチェックする必要がある
- 除外路線（excludedLines）のフィルタリングが必要
- 「全到達可能駅」を求める問題であり、単一ゴールへの最短経路ではない

### 乗り換えのモデル化

- 同一ノード（駅）で路線が変わる場合を「乗り換え」として検出
- 乗り換え時間は固定5分（Phase 2の簡易実装）
- 探索キューの各エントリに `currentLineId` を持たせ、次のエッジの `lineId` と比較して乗り換えを判定

### パフォーマンス

- 首都圏の鉄道駅: 約2,000〜3,000駅、エッジ数: 約10,000
- Dijkstra法 O((V+E) log V) で数ミリ秒〜数十ミリ秒で完了
- ブラウザ上で体感的に即座に結果が返るレベル

### 前回の問題点・改善案

1. **優先度付きキューが配列ソート** — `queue.sort()` は O(n log n) で毎回呼ばれる。ヒープベースの優先度付きキューに置き換えるべき
2. **乗り換えエッジの未実装** — `addTransferEdges` ���数が空実装だった。同一駅で異なる路線間の乗り換えをグラフのエッジとして明示的にモデル化すべきか、探索時の路線変更検出で十分かは要検討
3. **visited の粒度** — 駅IDだけで visited を管理すると、異なる路線経由で同じ駅に到達した場合に最適でない経路が選ばれる可能性がある。`(stationId, currentLineId)` のペアで管理する方が正確

## 3. GTFS変換スクリプト

### 技術的な実装ポイント

```
scripts/convertGtfs.ts
├── parseCSVStream()     — readline ベースのストリーミングCSVパーサー
├── parseCSVLine()       — RFC 4180 準拠のCSV行パーサー（クォート対応）
├── convertStops()       — stops.txt → Station[] （parent_station正規化）
├── convertRoutes()      — routes.txt + agency.txt → Line[] + Operator[]
├── calculateTravelTimes() — stop_times.txt + trips.txt → 駅間所要時間（中央値）
└── main()               — 全体のオーケストレーション
```

- 実行コマンド: `npx tsx scripts/convertGtfs.ts`
- package.json の scripts に `"convert-gtfs": "tsx scripts/convertGtfs.ts"` を定義

### 出力ファイル

- `public/data/stations.json` — 駅データ
- `public/data/lines.json` — 路線データ（segments含む）
- `public/data/operators.json` — 事業者データ

## 4. 技術スタック

### 採用したもの

| カテゴリ       | 技術                                  | バージョン（参考）             |
| -------------- | ------------------------------------- | ------------------------------ |
| フロントエンド | TypeScript + React                    | React 18.3, TS 5.6             |
| 地図描画       | Leaflet + react-leaflet               | Leaflet 1.9, react-leaflet 4.2 |
| ビルドツール   | Vite                                  | 6.0                            |
| グラフ探索     | graphology + graphology-shortest-path | graphology 0.25                |
| テスト         | Vitest + fast-check                   | Vitest 2.1, fast-check 3.23    |
| GTFS変換       | tsx（TypeScript実行）                 | tsx 4.21                       |

### Leaflet の注意点

- 国土地理院タイルまたは OSM タイルを使用（APIキー不要）
- `react-leaflet` は React 18 対応の v4 系を使用
- CSS の import を忘れるとタイルが表示されない（`import 'leaflet/dist/leaflet.css'`）

## 5. UI/UX の知見

### コンポーネント構成

```
App
├── StationSelector  — 駅検索・選択（テキスト入力 + ドロップダウン）
├── ConditionPanel   — 条件入力（移動時間・乗り換え回数・路線フィルタ）
├── MapComponent     — Leaflet地図（マーカー・路線オーバーレイ・等時線）
└── ResultList       — 到達可能駅の一覧表示（ソート可能）
```

### 色分け

- 移動時間に応じた緑→黄→赤のグラデーション
- 到達可能路線は通常色、到達不可能路線は低不透明度

### 駅名検索

- 漢字・ひらがな・カタカナの部分一致検索
- translations.txt から日本語名・かな名を取得する必要がある

## 6. テスト戦略

### プロパティベーステスト（fast-check）

前回定義した15個の正確性プロパティ:

| #   | プロパティ                           | 検証対象              |
| --- | ------------------------------------ | --------------------- |
| 1   | 駅名フィルタリングの正確性           | filterStations        |
| 2   | 駅選択時の地図中心移動               | MapComponent          |
| 3   | 検索条件バリデーション               | validateCondition     |
| 4   | 条件変更の即時反映                   | 状態管理              |
| 5   | 到達可能駅算出の正確性               | findReachableStations |
| 6   | グラフ構築とエッジ重みの正確性       | buildGraph            |
| 7   | 移動時間に応じた色分けの一貫性       | colorScale            |
| 8   | バウンディングボックスの包含性       | MapComponent          |
| 9   | ポップアップ・リスト項目の情報完全性 | ResultList            |
| 10  | 到達可能/不可能路線の色分け          | routeOverlay          |
| 11  | ソートの正確性                       | sortResults           |
| 12  | デフォルト全路線選択                 | ConditionPanel        |
| 13  | 路線フィルタの探索反映               | findReachableStations |
| 14  | 事業者グループ化の正確性             | groupLinesByOperator  |
| 15  | 事業者一括選択・解除                 | ConditionPanel        |

### テストの教訓

- プロパティテストのデータ生成で「マルチグラフ対応」を忘れると失敗する
- graphology の multi グラフでは同じ駅ペアに複数エッジが存在しうる
- テストデータ生成時に有効なグラフ構造（接続されたノード）を保証する必要がある
