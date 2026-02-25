# Implementation Plan: 駅到達可能範囲マップ

## Overview

4フェーズに分けて段階的に実装する。各フェーズは前フェーズの成果物の上に構築され、フェーズ末にチェックポイントを設ける。Phase 1で基盤（駅選択・条件入力・地図表示）、Phase 2でコアロジック（グラフ探索・マーカー表示）、Phase 3で路線描画、Phase 4で一覧表示・フィルタリングを実装する。

## Tasks

- [ ] 1. Phase 1: プロジェクトセットアップと基盤UI
  - [ ] 1.1 Vite + React + TypeScript プロジェクトの初期化
    - `npm create vite@latest` でプロジェクトを作成し、依存パッケージをインストールする
    - `leaflet`, `react-leaflet`, `graphology`, `graphology-shortest-path`, `vitest`, `fast-check` を追加
    - `src/types/` ディレクトリに `Station`, `Line`, `Operator`, `SearchCondition`, `ValidationResult` 等の型定義ファイルを作成する
    - _Requirements: 全体基盤_

  - [ ] 1.2 ODPT APIクライアントとデータキャッシュの実装
    - `src/services/odptApiClient.ts` を作成し、`fetchStations()`, `fetchLines()`, `fetchOperators()`, `fetchTrainTimetables()` を実装する
    - `src/services/dataCache.ts` を作成し、localStorageベースのキャッシュ（24時間有効期限）を実装する
    - APIキーを環境変数（`VITE_ODPT_API_KEY`）から読み込む設定を追加する
    - APIエラー時のエラーハンドリング（リトライボタン、キャッシュフォールバック）を実装する
    - _Requirements: 1.1, 3.6_

  - [ ] 1.3 StationSelector コンポーネントの実装
    - `src/components/StationSelector.tsx` を作成する
    - `filterStations` 関数を `src/utils/filterStations.ts` に実装する（漢字・かな部分一致検索）
    - テキスト入力による候補リストのドロップダウン表示を実装する
    - 該当なし時に「該当する駅が見つかりません」メッセージを表示する
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [ ]\* 1.4 Property 1: 駅名フィルタリングの正確性テスト
    - **Property 1: 駅名フィルタリングの正確性**
    - fast-checkで任意の駅データセットと検索文字列を生成し、`filterStations`の返却結果が全て検索文字列を部分文字列として含むこと、含まない駅が返されないことを検証する
    - **Validates: Requirements 1.2**

  - [ ] 1.5 ConditionPanel コンポーネントの実装
    - `src/components/ConditionPanel.tsx` を作成する
    - 最大移動時間（5〜120分）と最大乗り換え回数（0〜5回）の入力欄を実装する
    - `validateCondition` 関数を `src/utils/validateCondition.ts` に実装する
    - 範囲外入力時のリアルタイムエラーメッセージ表示を実装する
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]\* 1.6 Property 3: 検索条件バリデーションテスト
    - **Property 3: 検索条件バリデーション**
    - fast-checkで任意の数値を生成し、`validateCondition`が範囲内のみ`isValid: true`を返し、範囲外では適切なエラーメッセージを含むことを検証する
    - **Validates: Requirements 2.3, 2.4, 2.6**

  - [ ] 1.7 MapComponent 基本実装
    - `src/components/MapComponent.tsx` を作成する
    - Leaflet + react-leaflet で地図を表示する（国土地理院タイルまたはOSMタイル）
    - 出発駅選択時に地図中心を駅座標に移動する機能を実装する
    - 出発駅マーカーの表示を実装する
    - _Requirements: 1.4, 4.6_

  - [ ]\* 1.8 Property 2: 駅選択時の地図中心移動テスト
    - **Property 2: 駅選択時の地図中心移動**
    - fast-checkで任意の座標を持つ駅を生成し、選択後の地図中心座標が駅の緯度・経度と一致することを検証する
    - **Validates: Requirements 1.3, 1.4, 6.5**

  - [ ] 1.9 App コンポーネントでの状態管理と結合
    - `src/App.tsx` で `selectedStation`, `searchCondition` の状態管理を実装する
    - StationSelector, ConditionPanel, MapComponent を結合する
    - 条件変更時の即時反映（状態更新）を実装する
    - _Requirements: 2.5_

  - [ ]\* 1.10 Property 4: 条件変更の即時反映テスト
    - **Property 4: 条件変更の即時反映**
    - fast-checkで任意の有効な`SearchCondition`を生成し、条件変更後のアプリケーション状態が変更値と一致することを検証する
    - **Validates: Requirements 2.5, 7.4**

  - [ ]\* 1.11 Property 12: デフォルト全路線選択テスト
    - **Property 12: デフォルト全路線選択**
    - fast-checkで任意の路線データセットを生成し、条件パネルの初期状態で全路線が選択状態であることを検証する
    - **Validates: Requirements 7.3**

- [ ] 2. Phase 1 チェックポイント
  - Ensure all tests pass, ask the user if questions arise.
  - 駅選択、条件入力、基本地図表示が動作することを確認する

- [ ] 3. Phase 2: 到達可能範囲算出とマーカー表示
  - [ ] 3.1 時刻表データからの駅間所要時間算出
    - `src/services/timetableParser.ts` を作成する
    - `calculateSegmentTravelTimes` 関数を実装し、ODPT時刻表データから隣接駅間の所要時間（中央値）を算出する
    - _Requirements: 3.4_

  - [ ] 3.2 GraphService の実装（graphologyベース）
    - `src/services/graphService.ts` を作成する
    - `buildGraph` 関数を実装し、駅をノード、駅間接続をエッジ（移動時間を重み）としたgraphologyグラフを構築する
    - 同一駅での路線間乗り換えエッジ（固定5分）を追加する
    - _Requirements: 3.4, 3.5_

  - [ ]\* 3.3 Property 6: グラフ構築とエッジ重みの正確性テスト
    - **Property 6: グラフ構築とエッジ重みの正確性**
    - fast-checkで任意の路線データと時刻表データを生成し、`buildGraph`のエッジ`travelTime`が時刻表算出値と一致すること、乗り換えエッジが正しく生成されることを検証する
    - **Validates: Requirements 3.4, 3.5**

  - [ ] 3.4 ReachabilityEngine の実装
    - `src/services/reachabilityEngine.ts` を作成する
    - `findReachableStations` 関数を実装し、graphologyのDijkstra探索で到達可能駅を算出する
    - `maxTravelTime`, `maxTransfers`, `excludedLines` の制約を適用する
    - 各到達可能駅の移動時間・乗り換え回数・経路を返す
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [ ]\* 3.5 Property 5: 到達可能駅算出の正確性テスト
    - **Property 5: 到達可能駅算出の正確性**
    - fast-checkで任意のグラフ・出発駅・条件を生成し、返却される全駅が`travelTime <= maxTravelTime`かつ`transfers <= maxTransfers`を満たすこと、条件を満たす駅が漏れなく含まれることを検証する
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [ ] 3.6 MapComponent にマーカー表示機能を追加
    - 到達可能駅をマーカーとして地図上に表示する
    - `src/utils/colorScale.ts` を作成し、移動時間に応じた色分け関数を実装する（緑→黄→赤グラデーション）
    - マーカークリック時のポップアップ（駅名・移動時間・乗り換え回数）を実装する
    - 全到達可能駅が表示範囲に収まるようズームレベルを自動調整する
    - _Requirements: 4.1, 4.2, 4.5, 4.6_

  - [ ]\* 3.7 Property 7: 移動時間に応じた色分けの一貫性テスト
    - **Property 7: 移動時間に応じた色分けの一貫性**
    - fast-checkで任意の移動時間ペア`t1 < t2`を生成し、色分け関数の順序関係と同一時間での一貫性を検証する
    - **Validates: Requirements 4.2**

  - [ ]\* 3.8 Property 8: バウンディングボックスの包含性テスト
    - **Property 8: バウンディングボックスの包含性**
    - fast-checkで任意の座標セットを生成し、計算されるバウンディングボックスが全座標を包含することを検証する
    - **Validates: Requirements 4.6**

  - [ ] 3.9 App コンポーネントに到達可能範囲算出フローを結合
    - 出発駅と条件が揃った時点で`ReachabilityEngine`を呼び出し、結果をMapComponentに渡す
    - 条件変更時の再計算を実装する
    - データ取得失敗時のエラーメッセージ表示を実装する
    - _Requirements: 3.1, 3.6_

- [ ] 4. Phase 2 チェックポイント
  - Ensure all tests pass, ask the user if questions arise.
  - 出発駅選択→条件指定→到達可能駅のマーカー表示が一連の流れで動作することを確認する

- [ ] 5. Phase 3: 路線オーバーレイと等時線
  - [ ] 5.1 路線オーバーレイの生成と描画
    - `src/utils/routeOverlay.ts` を作成し、路線データから`RouteOverlay`を生成する関数を実装する
    - MapComponent に路線ポリラインの描画機能を追加する
    - 各路線を路線カラーで描画する
    - 路線クリック時のポップアップ（路線名）を実装する
    - _Requirements: 4.4, 5.1, 5.2, 5.3_

  - [ ] 5.2 到達可能/不可能路線の色分け表示
    - 到達可能範囲内の路線は通常色、範囲外の路線は薄い色（低不透明度）で表示する
    - `isReachable`フラグに基づく描画スタイルの切り替えを実装する
    - _Requirements: 5.4_

  - [ ]\* 5.3 Property 10: 到達可能/不可能路線の色分けテスト
    - **Property 10: 到達可能/不可能路線の色分け**
    - fast-checkで任意の路線と到達可能フラグを生成し、`isReachable: true`は通常色、`isReachable: false`は薄い色で表示されることを検証する
    - **Validates: Requirements 5.4**

  - [ ] 5.4 等時線（アイソクロン）の描画
    - `src/utils/isochrone.ts` を作成し、到達可能駅の座標から等時線ポリゴンを生成する関数を実装する
    - MapComponent に等時線ポリゴンの描画機能を追加する
    - _Requirements: 4.3_

- [ ] 6. Phase 3 チェックポイント
  - Ensure all tests pass, ask the user if questions arise.
  - 路線オーバーレイと等時線が地図上に正しく描画されることを確認する

- [ ] 7. Phase 4: 検索結果一覧と路線フィルタリング
  - [ ] 7.1 ResultList コンポーネントの実装
    - `src/components/ResultList.tsx` を作成する
    - 到達可能駅の一覧をリスト形式で表示する（駅名・路線名・移動時間・乗り換え回数）
    - `sortResults` 関数を `src/utils/sortResults.ts` に実装する
    - デフォルトで移動時間の昇順ソート、ソート条件変更機能を実装する
    - 駅クリック時に地図中心を該当駅に移動する機能を実装する
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]\* 7.2 Property 11: ソートの正確性テスト
    - **Property 11: ソートの正確性**
    - fast-checkで任意の`ReachableStation`リストとソートキー・ソート順を生成し、`sortResults`の結果が正しくソートされていることを検証する
    - **Validates: Requirements 6.3, 6.4**

  - [ ]\* 7.3 Property 9: ポップアップ・リスト項目の情報完全性テスト
    - **Property 9: ポップアップ・リスト項目の情報完全性**
    - fast-checkで任意の`ReachableStation`を生成し、ポップアップとリスト項目に駅名・移動時間・乗り換え回数（リストはさらに路線名）が全て含まれることを検証する
    - **Validates: Requirements 4.5, 6.2**

  - [ ] 7.4 ConditionPanel に路線フィルタリング機能を追加
    - 利用可能な路線一覧をチェックボックス付きで表示する
    - `src/utils/groupLinesByOperator.ts` を作成し、路線を事業者ごとにグループ化する関数を実装する
    - 事業者単位の一括選択・解除機能を実装する
    - デフォルトで全路線選択状態にする
    - 全路線解除時のエラーメッセージ「少なくとも1つの路線を選択してください」を表示する
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6, 7.7, 7.8_

  - [ ]\* 7.5 Property 14: 事業者グループ化の正確性テスト
    - **Property 14: 事業者グループ化の正確性**
    - fast-checkで任意の路線・事業者データを生成し、各グループ内の全路線が同一`operatorId`を持ち、全路線がいずれかのグループに属することを検証する
    - **Validates: Requirements 7.6**

  - [ ]\* 7.6 Property 15: 事業者一括選択・解除テスト
    - **Property 15: 事業者一括選択・解除**
    - fast-checkで任意の事業者を生成し、一括選択後は全路線が選択状態、一括解除後は全路線が非選択状態となることを検証する
    - **Validates: Requirements 7.7**

  - [ ] 7.7 路線フィルタの到達可能範囲エンジンへの反映
    - `excludedLines` パラメータを `findReachableStations` に渡し、除外路線を使わない探索を実装する
    - 路線フィルタ変更時の再計算を結合する
    - _Requirements: 7.4, 7.5_

  - [ ]\* 7.8 Property 13: 路線フィルタの探索反映テスト
    - **Property 13: 路線フィルタの探索反映**
    - fast-checkで任意のグラフと除外路線セットを生成し、`findReachableStations`の結果経路に除外路線IDが含まれないことを検証する
    - **Validates: Requirements 7.5**

- [ ] 8. 最終チェックポイント
  - Ensure all tests pass, ask the user if questions arise.
  - 全フェーズの機能が統合され、駅選択→条件指定→到達可能範囲表示→一覧確認→路線フィルタリングの全フローが動作することを確認する

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation per phase
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- 初期開発（Phase 1〜2）ではJR山手線・中央線など1〜2路線に限定し、Phase 3以降で段階的に路線を追加する
