# INP デモサイト作成プラン

## 概要

INP（Interaction to Next Paint）の計測とデモを行うWebサイトを作成する。
標準のWeb APIを使用して自前でINPを計測する実装を行う。

## 要件

- INPスコアが良い例と悪い例を比較できる
- UIからINPを計測できる（ボタンクリックで計測開始、結果表示）
- INP計測方法をdocsディレクトリにドキュメント化（使用する標準Web APIの説明）
- 技術スタック: pnpm + Vite + 素のHTML/CSS/JavaScript
- GitHub Pagesへデプロイ（リポジトリ: nus3/inp-demo）

## 実装プラン

### 1. プロジェクトセットアップ

- [ ] pnpm の初期化
- [ ] Vite のインストールと設定
- [ ] package.json の設定（scripts、依存関係）
- [ ] .gitignore の設定

### 2. 依存パッケージのインストール

- [ ] vite の devDependencies への追加
- 注: web-vitals は使用せず、標準Web APIで自前実装

### 3. 基本的なHTML/CSS/JS構造の実装

#### 3.1 ディレクトリ構成

```
inp-demo/
├── index.html
├── src/
│   ├── main.js
│   ├── style.css
│   ├── inp-monitor.js     # INP計測ロジック（自前実装）
│   └── demo-handlers.js   # デモのイベントハンドラー
├── docs/
│   └── inp-measurement.md # INP計測に使用する標準Web APIの説明
├── vite.config.js
├── package.json
└── .gitignore
```

#### 3.2 index.html

- メインレイアウト
- INP計測結果表示エリア
- 良いINPデモセクション
- 悪いINPデモセクション

### 4. INP計測機能の実装（自前実装）

#### 4.1 使用する標準Web API

- **PerformanceObserver API**: インタラクションイベントの観測
  - `event` エントリタイプを監視
  - `interactionId` でインタラクションを識別
- **Event Timing API**: インタラクションの遅延時間を取得
  - `processingStart`: イベント処理開始時刻
  - `processingEnd`: イベント処理終了時刻
  - `startTime`: イベント発生時刻
  - `duration`: インタラクション全体の時間
- INPの計算ロジック:
  - 同じ `interactionId` を持つエントリをグループ化
  - 各インタラクションの最大 duration を記録
  - ページ全体のINPは、全インタラクションの duration の98パーセンタイル値

#### 4.2 実装内容

- PerformanceObserverでイベントエントリを監視
- インタラクションごとのdurationを記録
- INP値の計算（98パーセンタイル）
- リアルタイムでのINP表示
- 計測のリセット機能

#### 4.3 UI要素

- 「計測開始」ボタン
- 現在のINP値の表示
- 各インタラクションの詳細表示（オプション）
- INPスコアの評価（Good/Needs Improvement/Poor）
  - Good: < 200ms
  - Needs Improvement: 200-500ms
  - Poor: > 500ms

### 5. INPデモの実装

#### 5.1 良いINPの例

- 即座に応答するボタン
- 軽量な処理のみ実行
- 視覚的フィードバックが素早い

実装例:
- シンプルなカウンターボタン
- 即座に色が変わるボタン
- 軽量なDOM更新

#### 5.2 悪いINPの例

- 重い同期処理を含むボタン
- 長時間メインスレッドをブロックする処理
- 大量のDOM操作

実装例:
- 長時間のループ処理を含むボタン（例: 200ms以上のブロッキング処理）
- 大量のDOM要素を一度に生成するボタン（1000個以上）
- 複雑な計算を同期的に実行するボタン（フィボナッチ数列など）

### 6. スタイリング

- シンプルで見やすいUI
- INP計測結果の色分け表示（Good=緑、Needs Improvement=黄、Poor=赤）
- レスポンシブデザイン
- デモセクションの明確な区分け

### 7. GitHub Pages デプロイ設定

#### 7.1 vite.config.js の設定

```javascript
export default {
  base: '/inp-demo/'
}
```

#### 7.2 GitHub Actions ワークフローの作成

- `.github/workflows/deploy.yml` の作成
- ビルドとデプロイの自動化
- main ブランチへのプッシュでトリガー

#### 7.3 package.json スクリプト

- `dev`: 開発サーバー起動
- `build`: 本番用ビルド
- `preview`: ビルド結果のプレビュー

### 8. ドキュメント作成

#### 8.1 docs/inp-measurement.md

以下の内容を含む:

1. **使用する標準Web API**
   - PerformanceObserver API
   - Event Timing API
   - 各APIの役割と使い方

2. **INP計測の仕組み**
   - PerformanceObserverの設定方法
   - `event` エントリタイプの監視
   - `interactionId` によるグループ化
   - duration の計算方法

3. **INP値の計算方法**
   - 98パーセンタイル値の計算
   - インタラクション数が少ない場合の最大値の使用

4. **コード例**
   - 実際の実装コードの抜粋
   - 重要な部分の解説

5. **参考リンク**
   - MDN ドキュメント
   - web.dev の記事

## 実装順序

1. プロジェクトセットアップとVite設定
2. 基本的なHTML構造とスタイル
3. INP計測機能の自前実装（PerformanceObserver使用）
4. 良いINP/悪いINPのデモ実装
5. ドキュメント作成（標準Web APIの説明）
6. GitHub Pages デプロイ設定
7. 動作確認とテスト

## 技術的な注意点

- PerformanceObserver の `event` タイプは比較的新しいAPIのため、ブラウザ対応状況を確認
- INPは実際のユーザーインタラクションが必要なため、自動テストは困難
- 開発環境と本番環境でINP値が異なる可能性がある
- GitHub Pages のベースパスを正しく設定する必要がある
- interactionId が存在しない古いブラウザへの対応は考慮しない（モダンブラウザのみサポート）
