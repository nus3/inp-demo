# GitHub Actions のセキュリティパターン

## Action の SHA 指定

### 基本方針

セキュリティ強化のため、すべての action は commit SHA で指定する。

```yaml
# ❌ 悪い例: タグ指定（タグは移動可能）
- uses: actions/checkout@v4

# ✅ 良い例: SHA 指定 + コメントでバージョン明記
- uses: actions/checkout@08eba0b27e820071cde6df949e0beb9ba4906955 # v4.3.0
```

### SHA の取得方法

1. GitHub リリースページから取得
2. WebFetch で取得
   ```
   https://github.com/{owner}/{repo}/releases
   ```

### よく使う Action の SHA（2025年10月時点）

```yaml
# Checkout
actions/checkout@08eba0b27e820071cde6df949e0beb9ba4906955 # v4.3.0

# pnpm setup
pnpm/action-setup@a7487c7e89a18df4991f7f222e4898a00d66ddda # v4.1.0

# Node.js setup
actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0

# GitHub Pages
actions/configure-pages@983d7736d9b0ae728b81ab479565c72886d7745b # v5.0.0
actions/upload-pages-artifact@56afc609e74202658d3ffba0e8f6dda462b719fa # v3.0.1
actions/deploy-pages@d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e # v4.0.5
```

## GitHub Pages デプロイパターン

### 基本構成

```yaml
jobs:
  build:
    steps:
      - uses: actions/checkout@{SHA}
      - uses: pnpm/action-setup@{SHA}
      - uses: actions/setup-node@{SHA}
      - run: pnpm install
      - run: pnpm run build
      - uses: actions/configure-pages@{SHA}
      - uses: actions/upload-pages-artifact@{SHA}
        with:
          path: ./dist

  deploy:
    needs: build
    environment:
      name: github-pages
    steps:
      - uses: actions/deploy-pages@{SHA}
```

### Vite プロジェクトの注意点

`vite.config.js` で base パスを設定:

```javascript
export default {
  base: '/リポジトリ名/'
}
```

## Permissions の設定

### 必要最低限の権限のみ付与

```yaml
# CI ワークフロー（ビルドチェックのみ）
permissions:
  contents: read

# Deploy ワークフロー（GitHub Pages デプロイ）
permissions:
  contents: read
  pages: write
  id-token: write
```

## バージョン管理のベストプラクティス

### package.json で一元管理

```json
{
  "packageManager": "pnpm@10.17.1",
  "engines": {
    "node": ">=22"
  }
}
```

### ワークフローでの使用

```yaml
# ❌ 悪い例: バージョンをハードコード
- uses: pnpm/action-setup@{SHA}
  with:
    version: 10

# ✅ 良い例: package.json から自動取得
- uses: pnpm/action-setup@{SHA}

- uses: actions/setup-node@{SHA}
  with:
    node-version: 22  # engines.node と一致させる
```

## CI/CD の分離パターン

### CI ワークフロー (ci.yml)

```yaml
on:
  push:
    branches-ignore: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    steps:
      - run: pnpm install
      - run: pnpm run build
```

### Deploy ワークフロー (deploy.yml)

```yaml
on:
  push:
    branches: [main]

jobs:
  build: # ビルドステップ
  deploy: # デプロイステップ
```
