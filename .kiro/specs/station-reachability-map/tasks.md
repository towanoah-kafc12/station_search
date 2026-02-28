# 実装計画: 駅到達可能範囲マップ

## 概要

GTFSデータから首都圏の鉄道網グラフを構築し、出発駅から指定乗り換え回数以内で到達可能な路線・駅を地図上に可視化するWebアプリケーションを実装する。一週目でコア機能（要件1〜8）、二週目で拡張機能（要件9〜11）を実装する。

## タスク

### 一週目（コア機能）

- [ ] 1. プロジェクトセットアップ
  - [ ] 1.1 Vite + React + TypeScript プロジェクトを初期化し、依存パッケージをインストールする
    - `npm create vite@latest . -- --template react-ts` でプロジェクト作成
    - 依存パッケージ: `graphology`, `leaflet`, `react-leaflet`
    - 開発依存: `@types/leaflet`, `@types/node`, `tsx`, `tailwindcss`, `@tailwindcss/vite`, `vitest`, `fast-check`, `@fast-check/vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`
    - Tailwind CSS を Vite プラグインとして設定する
    - Vitest の設定ファイル（vitest.config.ts）を作成する
    - TypeScript strict モードを有効にする
    - `package.json` に `"convert-gtfs": "tsx scripts/convertGtfs.ts"` スクリプトを追加する
    - `.gitignore` に `data/` を追加する
    - _要件: 8.2_

  - [ ] 1.2 型定義ファイルを作成する（src/types/index.ts）
    - Station, Line, LineSegment, Operator, SearchCondition, ReachableStation, RouteStep, NodeAttributes, EdgeAttributes, SearchEntry の全型定義を実装する
    - _要件: 全要件の基盤_

- [ ] 2. GTFS変換スクリプトの実装
  - [ ] 2.1 RFC 4180 準拠のCSVパーサーとストリーミング処理を実装する（scripts/convertGtfs.ts）
    - `parseCSVLine()`: クォートされたフィールド（カンマ、ダブルクォート、改行を含む）を正しく処理する
    - `parseCSVStream()`: readline ベースのストリーミング処理で AsyncIterable を返す
    - _要件: 1.4, 1.7_

  - [ ]\* 2.2 CSVパーサーのプロパティテストを作成する（scripts/convertGtfs.test.ts）
    - **Property 5: RFC 4180 CSVパースのラウンドトリップ**
    - **検証対象: 要件 1.7**

  - [ ] 2.3 駅データ変換を実装する（convertStops関数）
    - stops.txt から駅データを読み込み、parent_station で正規化する
    - translations.txt から日本語駅名（language=ja）とかな駅名（language=ja-Hrkt）を取得する
    - _要件: 1.1, 1.2, 1.3_

  - [ ]\* 2.4 駅データ変換のプロパティテストを作成する
    - **Property 1: 駅データのJSON変換ラウンドトリップ**
    - **検証対象: 要件 1.8**
    - **Property 2: parent_station による駅の正規化**
    - **検証対象: 要件 1.2**
    - **Property 3: 翻訳データからの日本語駅名取得**
    - **検証対象: 要件 1.3**

  - [ ] 2.5 路線データ変換と所要時間算出を実装する
    - routes.txt + agency.txt から路線・事業者データを変換する
    - stop_times.txt + trips.txt から隣接駅間の所要時間を中央値で算出する
    - shapes.txt から路線形状座標を抽出し、各区間に含める
    - stations.json, lines.json, operators.json を public/data/ に出力する
    - _要件: 1.1, 1.5, 1.6_

  - [ ]\* 2.6 所要時間中央値算出のプロパティテストを作成する
    - **Property 4: 所要時間の中央値算出**
    - **検証対象: 要件 1.5**

- [ ] 3. チェックポイント - GTFS変換の動作確認
  - `npm run convert-gtfs` を実行し、public/data/ に正しいJSONが出力されることを確認する
  - テストが全て通ることを確認する: `npx vitest --run`
  - 問題があればユーザーに確認する

- [ ] 4. ユーティリティ関数の実装
  - [ ] 4.1 最小ヒープ（MinHeap）を実装する（src/utils/minHeap.ts）
    - 配列ベースのバイナリヒープ、汎用コンパレータ対応
    - push, pop, peek, size, isEmpty を実装する
    - _要件: 4.5_

  - [ ]\* 4.2 MinHeap のユニットテストを作成する（src/utils/minHeap.test.ts）
    - push/pop の順序保証、空ヒープの動作、大量データでの正確性を検証する
    - _要件: 4.5_

  - [ ] 4.3 駅名フィルタリングを実装する（src/utils/filterStations.ts）
    - 漢字・ひらがな・カタカナの部分一致検索
    - カタカナ→ひらがな変換で統一的にマッチング
    - _要件: 2.1_

  - [ ]\* 4.4 駅名フィルタリングのプロパティテストを作成する（src/utils/filterStations.test.ts）
    - **Property 6: 駅名フィルタリングの正確性**
    - **検証対象: 要件 2.1**

  - [ ] 4.5 検索条件バリデーションを実装する（src/utils/validateCondition.ts）
    - maxTransfers を 0〜5 の範囲にクランプする
    - _要件: 3.4_

  - [ ]\* 4.6 検索条件バリデーションのプロパティテストを作成する（src/utils/validateCondition.test.ts）
    - **Property 7: 検索条件バリデーション（クランプ）**
    - **検証対象: 要件 3.4**

  - [ ] 4.7 結果ソートを実装する（src/utils/sortResults.ts）
    - 乗り換え回数昇順 → 移動時間昇順
    - _要件: 7.3_

  - [ ]\* 4.8 結果ソートのプロパティテストを作成する（src/utils/sortResults.test.ts）
    - **Property 13: 結果ソートの正確性**
    - **検証対象: 要件 7.3**

  - [ ] 4.9 色スケールを実装する（src/utils/colorScale.ts）
    - 移動時間に応じた緑→黄→赤のグラデーション
    - _要件: 6.4_

- [ ] 5. グラフサービスの実装
  - [ ] 5.1 グラフ構築を実装する（src/services/graphService.ts）
    - graphology の directed + multi グラフを構築する
    - 各駅を `stationId:lineId` の複合キーでノード化する
    - 隣接駅間を双方向エッジで接続する（路線ID、所要時間を属性に設定）
    - 同一駅に複数路線が乗り入れる場合、路線間の乗り換えエッジ（所要時間5分、isTransfer: true）を追加する
    - _要件: 5.1, 5.2, 5.3, 5.4_

  - [ ]\* 5.2 グラフ構築のプロパティテストを作成する（src/services/graphService.test.ts）
    - **Property 10: グラフの双方向性**
    - **検証対象: 要件 5.2, 5.5**
    - **Property 11: グラフの乗り換えエッジ**
    - **検証対象: 要件 5.3, 5.4**

- [ ] 6. 到達可能範囲エンジンの実装
  - [ ] 6.1 到達可能範囲エンジンを実装する（src/services/reachabilityEngine.ts）
    - 修正Dijkstra法による探索を実装する
    - 出発駅の全所属路線を乗り換え0回の初期エントリとしてヒープに追加する
    - 訪問済み状態を (stationId, lineId) ペアで管理する
    - 乗り換えエッジ通過時に乗り換え回数+1、maxTransfers超過時はスキップする
    - 各駅について最小移動時間の結果を返す
    - _要件: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]\* 6.2 到達可能範囲エンジンのプロパティテストを作成する（src/services/reachabilityEngine.test.ts）
    - **Property 8: 到達可能範囲の正確性**
    - **検証対象: 要件 4.1, 4.2, 4.3, 4.4**
    - **Property 9: 複数路線所属駅からの出発**
    - **検証対象: 要件 4.7**

- [ ] 7. チェックポイント - ロジック層の動作確認
  - テストが全て通ることを確認する: `npx vitest --run`
  - 問題があればユーザーに確認する

- [ ] 8. データローダーの実装
  - [ ] 8.1 データローダーを実装する（src/services/dataLoader.ts）
    - public/data/ から fetch で stations.json, lines.json, operators.json を読み込む
    - 型安全なパース処理とエラーハンドリング（リトライ1回、エラーメッセージ表示）
    - _要件: 8.4_

- [ ] 9. UIコンポーネントの実装
  - [ ] 9.1 アプリケーションのレイアウトを実装する（src/App.tsx）
    - 左側にサイドパネル、右側に地図の2カラムレイアウト
    - データ読み込み・グラフ構築の状態管理
    - ローディング中のスピナー表示
    - 全UIテキストを日本語で表示する
    - _要件: 8.1, 8.3, 8.4_

  - [ ] 9.2 駅セレクターを実装する（src/components/StationSelector.tsx）
    - テキスト入力と候補ドロップダウン
    - filterStations を使用した検索
    - 各候補に駅名と所属路線名を表示する
    - 入力が空の場合はドロップダウン非表示
    - 0件の場合は「該当する駅が見つかりません」を表示する
    - 選択時に出発駅を確定し、地図の中心を移動する
    - _要件: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 9.3 条件パネルを実装する（src/components/ConditionPanel.tsx）
    - 乗り換え回数 0〜5回のスライダー（デフォルト: 1回）
    - validateCondition を使用した値の補正
    - 変更時に即座に再計算をトリガーする
    - _要件: 3.1, 3.2, 3.3, 3.4_

  - [ ] 9.4 地図コンポーネントを実装する（src/components/MapComponent.tsx）
    - 国土地理院タイルを背景として表示する
    - 初期中心: 東京駅付近（35.681, 139.767）
    - 到達可能路線を shapes.txt の路線形状で描画し、路線カラーで色付けする
    - 到達不可能路線を低不透明度で表示する
    - 出発駅を特別マーカーで表示する
    - 到達可能駅を大きめの円マーカー + 駅名ラベルで表示する
    - 到達可能範囲更新時にバウンディングボックスを自動調整する
    - _要件: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ] 9.5 結果パネルを実装する（src/components/ResultPanel.tsx）
    - 路線別にグループ化して到達可能駅の一覧を表示する
    - 各駅: 駅名、所属路線名、乗り換え回数、移動時間（分）
    - sortResults を使用したソート
    - 駅名クリックで地図パン + ポップアップ
    - 到達可能駅・路線の総数を表示する
    - 未選択時: 「出発駅を選択してください」
    - _要件: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 10. 全体結合とスタイリング
  - [ ] 10.1 全コンポーネントを App.tsx で結合し、データフローを接続する
    - データ読み込み → グラフ構築 → 駅選択 → 探索 → 地図更新 + 結果パネル更新の一連のフローを接続する
    - Leaflet CSS のインポートを忘れないこと（`import 'leaflet/dist/leaflet.css'`）
    - _要件: 8.1, 8.4_

  - [ ] 10.2 Tailwind CSS でレスポンシブレイアウトとスタイリングを仕上げる
    - 2カラムレイアウトの調整
    - サイドパネルのスクロール対応
    - ローディングスピナーのスタイリング
    - _要件: 8.1, 8.2_

- [ ] 11. 最終チェックポイント（一週目）
  - テストが全て通ることを確認する: `npx vitest --run`
  - 問題があればユーザーに確認する

---

### 二週目（拡張機能）

- [ ]\* 12. 所要時間取得APIの実装
  - [ ]\* 12.1 所要時間取得サービスを実装する（src/services/travelTimeService.ts）
    - 外部APIを使用して出発駅から到着駅への電車での所要時間を取得する
    - 平日朝8時30分着の条件で取得する
    - レートリミット制御を実装する
    - API呼び出しタイムアウト（10秒）を設定する
    - エラーハンドリング（4xx/5xx、タイムアウト）
    - _要件: 9.1, 9.2, 11.1, 11.2_

  - [ ]\* 12.2 所要時間キャッシュサービスを実装する（src/services/travelTimeCacheService.ts）
    - ローカルストレージまたはセッションストレージにキャッシュする
    - キャッシュキー: `${fromStationId}-${toStationId}`
    - キャッシュ有効期限: 24時間
    - 期限切れキャッシュの自動削除
    - _要件: 10.1, 10.2, 10.3, 10.4_

  - [ ]\* 12.3 キャッシュサービスのプロパティテストを作成する（src/services/travelTimeCacheService.test.ts）
    - **Property 15: 所要時間キャッシュのラウンドトリップ**
    - **検証対象: 要件 10.1, 10.2, 10.3**
    - **Property 16: キャッシュの有効期限**
    - **検証対象: 要件 10.4**

- [ ]\* 13. 所要時間表示UIの実装
  - [ ]\* 13.1 地図コンポーネントに駅クリック時の所要時間取得・表示機能を追加する
    - 到達可能駅マーカークリック時にポップアップで所要時間を表示する
    - API呼び出し中は「所要時間を取得中...」を表示する
    - API失敗時は「所要時間の取得に失敗しました」を表示する
    - キャッシュ済みの場合はAPIを呼び出さずにキャッシュから表示する
    - _要件: 9.1, 9.3, 9.4, 10.2_

- [ ]\* 14. 最終チェックポイント（二週目）
  - テストが全て通ることを確認する: `npx vitest --run`
  - 問題があればユーザーに確認する

## 備考

- `*` マーク付きのタスクはオプションであり、スキップ可能
- 各タスクは具体的な要件を参照しており、トレーサビリティを確保している
- チェックポイントで段階的に動作確認を行う
- プロパティテストは設計書の正確性プロパティ（Property 1〜16）に対応している
- 二週目のタスク（12〜14）は全てオプショナルであり、一週目のコア機能が完成した後に着手する
