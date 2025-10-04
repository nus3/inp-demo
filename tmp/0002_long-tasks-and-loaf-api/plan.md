# Long Tasks API と Long Animation Frames API の追加

## 概要

既存の INP デモサイトに、Long Tasks API と Long Animation Frames API (LoAF) の使用例を追加し、ドキュメント化する。

## 要件

- Long Tasks API の監視機能を実装
- Long Animation Frames API の監視機能を実装
- ブラウザサポートチェック機能を追加（Chromium系のみサポート）
- 新しいドキュメントファイルを作成（`docs/long-tasks-and-loaf.md`）
- デモページに新しいセクションを追加して、これらのAPIの動作を確認できるようにする

## 実装プラン

### 1. ブラウザサポート確認モジュールの作成

**ファイル**: `src/browser-support.js`

以下の機能を実装:

```javascript
/**
 * Long Tasks API のサポート確認
 * Chrome 58+, Edge 79+
 */
export function isLongTasksAPISupported()

/**
 * Long Animation Frames API のサポート確認
 * Chrome 123+, Edge 123+
 */
export function isLoAFAPISupported()
```

実装方法:
```javascript
// Long Tasks API
PerformanceObserver.supportedEntryTypes?.includes('longtask')

// Long Animation Frames API
PerformanceObserver.supportedEntryTypes?.includes('long-animation-frame')
```

### 2. Long Tasks API 監視モジュールの作成

**ファイル**: `src/long-tasks-monitor.js`

以下の機能を実装:

```javascript
/**
 * Long Tasks（50ms以上メインスレッドを占有するタスク）を監視
 * @param {Function} onLongTask - ロングタスク検出時のコールバック
 * @returns {Object} { stop, getLongTasks }
 */
export function startLongTasksMonitor(onLongTask)
```

取得する情報:
- `name`: タスクの種類
- `startTime`: タスク開始時刻
- `duration`: タスクの実行時間（50ms以上）
- `attribution`: タスクの起因情報（可能な場合）

### 3. Long Animation Frames API 監視モジュールの作成

**ファイル**: `src/loaf-monitor.js`

以下の機能を実装:

```javascript
/**
 * Long Animation Frames を監視
 * @param {Function} onLoAF - LoAF検出時のコールバック
 * @returns {Object} { stop, getLoAFs }
 */
export function startLoAFMonitor(onLoAF)
```

取得する情報:
- `startTime`: フレーム開始時刻
- `duration`: フレーム全体の時間
- `renderStart`: レンダリング開始時刻
- `styleAndLayoutStart`: スタイル・レイアウト計算開始時刻
- `blockingDuration`: ブロッキング時間
- `firstUIEventTimestamp`: 最初のUIイベントがキューに入った時刻
- `scripts`: スクリプト実行の詳細情報（配列）
  - `name`: スクリプト名
  - `startTime`: 実行開始時刻
  - `duration`: 実行時間
  - `invoker`: 呼び出し元

フレームのタイムライン構造:
- Frame Start (`startTime`)
- Render Start (`renderStart`) - requestAnimationFrame コールバックを含む
- Style and Layout Start (`styleAndLayoutStart`)
- Frame End (`startTime + duration`)

各フェーズの処理時間を計算:
```javascript
const scriptDuration = renderStart - startTime;
const renderDuration = styleAndLayoutStart - renderStart;
const styleLayoutDuration = (startTime + duration) - styleAndLayoutStart;
```

### 4. UI の実装

**更新ファイル**: `index.html`

新しいセクションを追加:

```html
<section class="monitor-section">
  <h2>Long Tasks と Long Animation Frames の監視</h2>

  <!-- ブラウザサポート警告 -->
  <div id="api-support-warning" class="warning-banner">
    <!-- JavaScript で動的に表示 -->
  </div>

  <!-- Long Tasks セクション -->
  <div class="monitor-card">
    <h3>Long Tasks API</h3>
    <p>50ms以上メインスレッドを占有するタスクを検出します。</p>
    <button id="toggle-longtasks" class="btn btn-primary">監視開始</button>
    <div id="longtasks-list" class="tasks-list"></div>
  </div>

  <!-- Long Animation Frames セクション -->
  <div class="monitor-card">
    <h3>Long Animation Frames API</h3>
    <p>長時間実行されるアニメーションフレームを詳細に計測します。</p>
    <button id="toggle-loaf" class="btn btn-primary">監視開始</button>
    <div id="loaf-list" class="loaf-list"></div>
  </div>
</section>
```

UI の動作:
- ブラウザが Chromium 系でない場合、警告バナーを表示
- 各 API がサポートされていない場合、該当セクションを無効化
- 監視開始/停止ボタン
- 検出されたタスク/フレームのリアルタイム表示

### 5. デモハンドラーの更新

**更新ファイル**: `src/demo-handlers.js` または 新規ファイル: `src/long-tasks-demo.js`

既存の「悪いINPの例」のボタンが Long Tasks と LoAF をトリガーするので、
新しいハンドラーを追加する必要はない可能性がある。

必要に応じて、以下を追加:
- Long Tasks を意図的に発生させるデモボタン
- Long Animation Frames を発生させるデモボタン

### 6. ドキュメントの作成

**新規ファイル**: `docs/long-tasks-and-loaf.md`

以下の内容を含む:

#### 6.1 Long Tasks API セクション

1. **概要**
   - Long Tasks API とは
   - 50ms以上のタスクを検出する理由
   - INP との関連性

2. **基本的な使い方**
   - PerformanceObserver の設定方法
   - コード例
   ```javascript
   const observer = new PerformanceObserver((list) => {
     for (const entry of list.getEntries()) {
       console.log('Long Task detected:', entry);
     }
   });
   observer.observe({ type: 'longtask', buffered: true });
   ```

3. **取得できる情報**
   - `name`: タスクの種類
   - `startTime`: 開始時刻
   - `duration`: 実行時間
   - `attribution`: 起因情報（コンテナ、スクリプトなど）

4. **ブラウザサポート**
   - Chrome 58+
   - Edge 79+
   - Firefox/Safari: 未対応
   - サポート確認方法

#### 6.2 Long Animation Frames API セクション

1. **概要**
   - Long Animation Frames API とは
   - Long Tasks API との違い
   - より詳細なパフォーマンス分析が可能

2. **基本的な使い方**
   - PerformanceObserver の設定方法
   - コード例
   ```javascript
   const observer = new PerformanceObserver((list) => {
     for (const entry of list.getEntries()) {
       console.log('Long Animation Frame:', entry);
     }
   });
   observer.observe({ type: 'long-animation-frame', buffered: true });
   ```

3. **取得できる情報**
   - `startTime`: フレーム開始時刻
   - `duration`: フレーム全体の時間
   - `renderStart`: レンダリング開始時刻
   - `styleAndLayoutStart`: スタイル・レイアウト計算開始時刻
   - `blockingDuration`: ブロッキング時間
   - `firstUIEventTimestamp`: 最初のUIイベントがキューに入った時刻
   - `scripts`: スクリプト実行の詳細（配列）
     - 各スクリプトの実行時間
     - 呼び出し元情報
     - ソース URL

4. **フレームのタイムライン構造**
   - Frame Start (`startTime`)
   - Render Start (`renderStart`) - requestAnimationFrame コールバックを含む
   - Style and Layout Start (`styleAndLayoutStart`)
   - Frame End (`startTime + duration`)

   スタイル・レイアウトの処理時間を計算:
   ```javascript
   const styleLayoutDuration = (startTime + duration) - styleAndLayoutStart;
   ```

5. **ブラウザサポート**
   - Chrome 123+
   - Edge 123+
   - Firefox/Safari: 未対応
   - サポート確認方法

6. **実践的な使用例**
   - INP の問題診断への活用
   - パフォーマンスボトルネックの特定
   - スクリプト実行の詳細分析
   - スタイル・レイアウト処理時間の計測
     ```javascript
     const observer = new PerformanceObserver((list) => {
       for (const entry of list.getEntries()) {
         const {startTime, duration, renderStart, styleAndLayoutStart} = entry;

         // 各フェーズの時間を計算
         const scriptDuration = renderStart - startTime;
         const renderDuration = styleAndLayoutStart - renderStart;
         const styleLayoutDuration = (startTime + duration) - styleAndLayoutStart;

         console.log('Script:', scriptDuration, 'ms');
         console.log('Render:', renderDuration, 'ms');
         console.log('Style/Layout:', styleLayoutDuration, 'ms');
       }
     });
     observer.observe({ type: 'long-animation-frame', buffered: true });
     ```

7. **参考リンク**
   - Chrome Developers のドキュメント
   - MDN（利用可能な場合）
   - W3C 仕様

### 7. index.html のドキュメントリンク更新

フッターに新しいドキュメントへのリンクを追加:

```html
<footer>
  <p>
    <a href="./docs/inp-measurement.md">INP計測方法</a>
    |
    <a href="./docs/long-tasks-and-loaf.md">Long Tasks & LoAF API</a>
    |
    <a href="https://github.com/nus3/inp-demo">GitHub</a>
  </p>
</footer>
```

### 8. スタイルの追加

**更新ファイル**: `src/style.css`

以下のスタイルを追加:

- `.warning-banner`: ブラウザサポート警告用
- `.tasks-list`: Long Tasks のリスト表示用
- `.loaf-list`: LoAF のリスト表示用
- `.task-item`, `.loaf-item`: 各エントリのスタイル
- `.disabled`: サポートされていない機能の無効化表示

## 実装順序

1. ブラウザサポート確認モジュールの作成（`src/browser-support.js`）
2. Long Tasks API 監視モジュールの作成（`src/long-tasks-monitor.js`）
3. Long Animation Frames API 監視モジュールの作成（`src/loaf-monitor.js`）
4. UI の実装（`index.html` の更新）
5. スタイルの追加（`src/style.css`）
6. メインJSでの統合（`src/main.js`）
7. ドキュメントの作成（`docs/long-tasks-and-loaf.md`）
8. 動作確認（Chromium ベースのブラウザで）

## 技術的な注意点

- **ブラウザサポートの確認は必須**
  - 両APIともChromium系のみサポート
  - サポートされていない環境では適切なメッセージを表示

- **PerformanceObserver の適切な使用**
  - `buffered: true` オプションでページロード時のデータも取得
  - メモリリークを防ぐため、不要時は `disconnect()` を呼ぶ

- **Long Animation Frames の詳細データ**
  - `scripts` 配列には複数のスクリプト実行情報が含まれる
  - プライバシー保護のため、クロスオリジンスクリプトの情報は制限される

- **パフォーマンスへの影響**
  - PerformanceObserver 自体は軽量だが、大量のエントリを処理する場合は注意
  - UI 更新の頻度を制限する（debounce など）

- **既存機能との統合**
  - 既存の INP 計測と併用して、より詳細な分析を可能にする
  - 「悪いINPの例」のボタンが Long Tasks をトリガーすることを確認

## 期待される成果物

1. **新規ファイル**
   - `src/browser-support.js`
   - `src/long-tasks-monitor.js`
   - `src/loaf-monitor.js`
   - `docs/long-tasks-and-loaf.md`

2. **更新ファイル**
   - `index.html`（新しいセクションとフッターリンク）
   - `src/style.css`（新しいスタイル）
   - `src/main.js`（新しいモジュールの統合）

3. **ドキュメント**
   - 詳細な API 説明
   - コード例
   - ブラウザサポート情報
   - 実践的な使用方法

## 検証方法

1. **Chromium ベースのブラウザ（Chrome/Edge）で確認**
   - Long Tasks API が正常に動作すること
   - Long Animation Frames API が正常に動作すること（Chrome 123+ の場合）
   - 「悪いINPの例」のボタンで Long Tasks が検出されること

2. **非 Chromium ブラウザ（Firefox/Safari）で確認**
   - 適切な警告メッセージが表示されること
   - 機能が無効化されること
   - エラーが発生しないこと

3. **ドキュメントの確認**
   - マークダウンが正しくレンダリングされること
   - コード例が正確であること
   - リンクが正しく機能すること
