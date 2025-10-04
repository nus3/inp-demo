# プロジェクト規約

## コーディングスタイル

### class構文を避ける

**理由**: 暗黙的に内部状態を持つことを避けるため

```javascript
// ❌ 避けるパターン
class Monitor {
  constructor() {
    this.data = [];
  }
  add(item) { this.data.push(item); }
}

// ✅ 推奨パターン
function createMonitor() {
  let data = [];
  return {
    add: (item) => data.push(item),
    get: () => [...data]
  };
}
```

### 状態管理はクロージャで

関数スコープで状態を保持し、外部に公開する関数を返す。

## ファイル構成

```
src/
├── main.js          # エントリーポイント
├── style.css        # グローバルスタイル
├── {feature}.js     # 機能ごとのモジュール
└── {feature}-*.js   # サブモジュール（必要な場合）
```

## ドキュメント構成

### docs/ - ユーザー向けドキュメント

使用する Web API の説明や計測方法など、エンドユーザーが理解すべき内容。

### ai-guide/ - AI 向けガイド

将来の実装時に参照すべきパターンやベストプラクティス（このファイル）。

## 技術スタック

- **パッケージマネージャー**: pnpm
- **ビルドツール**: Vite
- **スタイル**: 素のCSS（フレームワーク不使用）
- **JavaScript**: ES Modules、標準Web APIを優先

## 命名規則

- ファイル名: kebab-case (`inp-monitor.js`)
- 関数名: camelCase (`startINPMonitor`)
- 定数: UPPER_SNAKE_CASE (使用頻度低)
- コンポーネント: 機能名を明確に (`createCounter`, `startMonitor`)
