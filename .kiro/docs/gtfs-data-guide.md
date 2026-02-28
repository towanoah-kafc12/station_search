# GTFSデータ取得・変換ガイド

## 概要

本プロジェクトでは、TokyoGTFS で生成した GTFS ファイルを `data/gtfs/` に配置し、
変換スクリプトでアプリ用 JSON に変換して `public/data/` に出力する。

## 1. TokyoGTFS のセットアップ

```bash
# リポジトリをクローン
git clone https://github.com/MKuranowski/TokyoGTFS.git data/TokyoGTFS

# Python仮想環境を作成・有効化
cd data/TokyoGTFS
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# 依存パッケージをインストール
pip install -r requirements.txt
```

## 2. GTFSデータの生成

```bash
# 鉄道データのみ生成（APIキー不要）
cd data/TokyoGTFS
python -m tokyo_gtfs.rail

# 生成されたGTFSファイルは tokyo_rail.zip に出力される
```

## 3. GTFSファイルの配置

```bash
# プロジェクトルートに戻る
cd ../..

# zipを展開して data/gtfs/ に配置
# Windows (PowerShell):
Expand-Archive -Path data/TokyoGTFS/tokyo_rail.zip -DestinationPath data/gtfs -Force

# macOS/Linux:
unzip -o data/TokyoGTFS/tokyo_rail.zip -d data/gtfs
```

### 配置後のディレクトリ構造

```
data/gtfs/
├── agency.txt          # 事業者データ
├── calendar.txt        # 運行日データ
├── calendar_dates.txt  # 運行日例外データ
├── routes.txt          # 路線データ
├── shapes.txt          # 路線形状データ
├── stops.txt           # 駅データ
├── stop_times.txt      # 時刻表データ（115MB超、最大ファイル）
├── transfers.txt       # 乗り換えデータ
├── translations.txt    # 多言語翻訳データ
└── trips.txt           # 運行データ
```

## 4. アプリ用JSONへの変換

```bash
# 変換スクリプトを実行
npm run convert-gtfs
# または
npx tsx scripts/convertGtfs.ts
```

### 出力ファイル

```
public/data/
├── stations.json    # 駅データ（id, name, nameKana, lat, lng, lineIds, operatorId）
├── lines.json       # 路線データ（id, name, operatorId, color, stationIds, segments）
└── operators.json   # 事業者データ（id, name, lineIds）
```

## 5. 注意事項

### ファイルサイズ

- `stop_times.txt` は 115MB 超。GitHub の 100MB 制限に引っかかるため、`data/` は必ず `.gitignore` に含める
- 変換スクリプトでは readline によるストリーミング処理が必須

### 駅の正規化（parent_station）

GTFSでは同一駅でも路線ごとに異なる `stop_id` が割り当てられる。
`stops.txt` の `parent_station` フィールドで同一駅を束ねる:

- `parent_station` が設定されている → それを駅IDとして使用
- `parent_station` が空 → `stop_id` をそのまま使用

### 日本語駅名の取得

`stops.txt` の `stop_name` はローマ字表記の場合がある。
`translations.txt` から日本語名を取得する:

```
table_name=stops, field_name=stop_name, language=ja → 日本語駅名
table_name=stops, field_name=stop_name, language=ja-Hrkt → かな駅名
```

### 駅間所要時間の算出

1. `trips.txt` + `calendar.txt` から平日運行の trip_id を特定
2. 各 trip の `stop_times.txt` から隣接駅間の時間差を計算
3. 同一区間の複数 trip から中央値を採用

### ライセンス

GTFSデータ: MIT License (Copyright (c) 2019-2025 Akihiko Kusanagi)
