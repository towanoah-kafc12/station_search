# プロジェクトルール: 駅到達可能範囲マップ（v2）

## 状態

- 現在: クリーンスレート（ソースコード・データ全削除済み）
- バックアップ: `backup/phase-4-full-implementation` ブランチに v1 の全実装を保存
- ノウハウ文書: `.kiro/docs/` に前回の知見を集約済み

## 言語・スタイル

- コミットメッセージは日本語で記述する（例: `feat: 駅セレクターを実装`）
- コード内のコメントは日本語を基本とし、JSDoc等の型注釈は英語でもよい
- UIのテキスト・エラーメッセージは全て日本語で表示する
- 変数名・関数名・ファイル名は英語（camelCase / PascalCase）を使用する

## Git運用

- 各タスク完了時に必ずコミット→プッシュする
- featureブランチで開発し、mainブランチへはリベースしてマージする
- ブランチ名: `feature/概要` （例: `feature/graph-engine`）
- コミットメッセージのプレフィックス: `feat:`, `fix:`, `test:`, `refactor:`, `chore:`, `docs:`

## コーディング規約

- TypeScript の strict モードを有効にする
- 型定義は `src/types/` に集約する
- ユーティリティ関数は `src/utils/` に配置し、UIから独立してテスト可能にする
- サービス層は `src/services/` に配置する
- コンポーネントは `src/components/` に配置する
- 未使用のインポートや変数を残さない

## テスト

- プロパティベーステスト（fast-check）を活用する
- テストファイルは対象ファイルと同じディレクトリに `*.test.ts` / `*.test.tsx` として配置する
- テスト実行: `npx vitest --run`

## データソース

- 鉄道データ: TokyoGTFS（https://github.com/MKuranowski/TokyoGTFS）
- GTFSファイルは `data/gtfs/` に配置（.gitignore済み、115MB超のファイルあり）
- 変換後のJSONは `public/data/` に配置
- GTFSデータのライセンス: MIT License (Copyright (c) 2019-2025 Akihiko Kusanagi)
- データ取得・変換手順: `.kiro/docs/gtfs-data-guide.md` を参照

## 参照ドキュメント

- ノウハウ集: `.kiro/docs/lessons-learned.md`
- GTFSデータガイド: `.kiro/docs/gtfs-data-guide.md`
- アーキテクチャリファレンス: `.kiro/docs/architecture-reference.md`
- 要件定義: 未作成（新しい方針で作成予定）
- 設計書: 未作成（新しい方針で作成予定）
