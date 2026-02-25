# プロジェクトルール: 駅到達可能範囲マップ

## 言語・スタイル

- コミットメッセージは日本語で記述する（例: `feat: 駅セレクターを実装`）
- コード内のコメントは日本語を基本とし、JSDoc等の型注釈は英語でもよい
- UIのテキスト・エラーメッセージは全て日本語で表示する
- 変数名・関数名・ファイル名は英語（camelCase / PascalCase）を使用する

## Git運用

- 各タスク完了時に必ずコミット→プッシュする
- バグ修正やリファクタリングなど、人間の一般的なコミット粒度で適宜コミットする
- featureブランチで開発し、mainブランチへはリベースしてマージする
  - `git rebase main` → `git checkout main` → `git merge --ff-only feature/xxx`
- ブランチ名: `feature/phase-N-概要` （例: `feature/phase-1-setup`）
- コミットメッセージのプレフィックス: `feat:`, `fix:`, `test:`, `refactor:`, `chore:`, `docs:`

## コーディング規約

- TypeScript の strict モードを有効にする
- 型定義は `src/types/` に集約する
- ユーティリティ関数は `src/utils/` に配置し、UIから独立してテスト可能にする
- サービス層は `src/services/` に配置する
- コンポーネントは `src/components/` に配置する
- 未使用のインポートや変数を残さない

## テスト

- プロパティベーステスト（fast-check）は設計書の正確性プロパティに対応させる
- テストファイルは対象ファイルと同じディレクトリに `*.test.ts` / `*.test.tsx` として配置する
- テスト実行: `npx vitest --run`
- プロパティテストは最低100回のイテレーションで実行する

## 段階的開発

- Phase 1〜4の順序で段階的に実装する
- 各フェーズのチェックポイントでユーザーに動作確認を求める
- 初期開発（Phase 1〜2）ではJR山手線・中央線など1〜2路線に限定する

## ドキュメント・ルールの最新化

- このsteering fileの内容はプロジェクトの進行に合わせて都度最新化する
- 複雑なワークフローや手順が発生した場合は `.kiro/skills/` にSkillとして切り出す
- specドキュメント（requirements.md, design.md, tasks.md）も実装の進行に合わせて更新する

## 参照ドキュメント

- 要件定義: `.kiro/specs/station-reachability-map/requirements.md`
- 設計書: `.kiro/specs/station-reachability-map/design.md`
- タスクリスト: `.kiro/specs/station-reachability-map/tasks.md`
