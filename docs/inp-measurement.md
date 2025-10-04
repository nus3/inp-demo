# INP の計測方法

このドキュメントでは、標準のWeb APIを使用してINP（Interaction to Next Paint）を計測する方法について説明します。

## 目次

- [使用する標準Web API](#使用する標準web-api)
- [INP計測の仕組み](#inp計測の仕組み)
- [実装例](#実装例)
- [INP値の計算方法](#inp値の計算方法)
- [参考リンク](#参考リンク)

## 使用する標準Web API

INPの計測には、以下の標準Web APIを使用します。

### 1. PerformanceObserver API

PerformanceObserverは、パフォーマンス関連のイベントを非同期で監視するためのAPIです。

```javascript
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // エントリを処理
  }
});

observer.observe({
  type: 'event',
  buffered: true
});
```

**主なオプション:**
- `type: 'event'`: Event Timing APIのイベントエントリを監視
- `buffered: true`: 監視開始前のイベントも取得

### 2. Event Timing API

Event Timing APIは、ユーザーインタラクションのタイミング情報を提供します。
PerformanceObserverで `'event'` タイプを監視すると、`PerformanceEventTiming` エントリが取得できます。

**PerformanceEventTimingの主なプロパティ:**

| プロパティ | 説明 |
|-----------|------|
| `name` | イベントの種類（例: 'click', 'keydown'など） |
| `interactionId` | インタラクションの一意なID。同じインタラクションの複数イベントは同じIDを持つ |
| `duration` | イベント開始から次のフレームの描画までの時間（ミリ秒） |
| `startTime` | イベントが発生した時刻 |
| `processingStart` | イベントハンドラーの処理開始時刻 |
| `processingEnd` | イベントハンドラーの処理終了時刻 |
| `target` | イベントのターゲット要素 |

**タイムラインの構造:**

```
startTime                processingStart       processingEnd              startTime + duration
    |                           |                    |                              |
    |<-- 入力遅延 -->|<-- 処理時間 -->|<-- 描画遅延 -->|
    |                           |                    |                              |
ユーザー操作              ハンドラー開始        ハンドラー終了                    次のフレーム描画
```

## INP計測の仕組み

### 1. PerformanceObserverの設定

まず、`PerformanceObserver`を作成し、`'event'` タイプのエントリを監視します。

```javascript
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    processEntry(entry);
  }
});

observer.observe({
  type: 'event',
  buffered: true
});
```

### 2. インタラクションの識別とグループ化

`interactionId`を使用して、インタラクションを識別します。

**重要なポイント:**
- `interactionId`が`0`の場合、そのイベントはインタラクションとしてカウントされません（例: hoverイベント）
- 同じ`interactionId`を持つ複数のイベントは、1つのインタラクションとして扱われます
- 例: クリックイベントは`pointerdown`、`pointerup`、`click`の3つのイベントから構成される場合があり、すべて同じ`interactionId`を持ちます

```javascript
function processEntry(entry) {
  // interactionId が 0 の場合はスキップ
  if (!entry.interactionId) {
    return;
  }

  const interactionId = entry.interactionId;
  const duration = entry.duration;

  // 同じ interactionId の中で最大の duration を記録
  const currentMax = interactions.get(interactionId) || 0;
  if (duration > currentMax) {
    interactions.set(interactionId, duration);
  }
}
```

### 3. durationの取得

各インタラクションの`duration`は、以下を含みます:

1. **入力遅延**: イベント発生からハンドラー開始まで
2. **処理時間**: イベントハンドラーの実行時間
3. **描画遅延**: ハンドラー終了から次のフレーム描画まで

```javascript
// duration の内訳
const inputDelay = entry.processingStart - entry.startTime;
const processingTime = entry.processingEnd - entry.processingStart;
const presentationDelay = entry.duration - (entry.processingEnd - entry.startTime);
```

## 実装例

以下は、INPを計測する完全な実装例です（関数ベース）。

```javascript
/**
 * INP値を計算
 * @param {Array} allDurations - すべてのインタラクションのdurationリスト
 * @returns {number|null} INP値（ミリ秒）
 */
function calculateINP(allDurations) {
  if (allDurations.length === 0) {
    return null;
  }

  const sortedDurations = [...allDurations]
    .map(d => d.duration)
    .sort((a, b) => a - b);

  // インタラクション数が50未満の場合は最大値
  if (sortedDurations.length < 50) {
    return Math.round(sortedDurations[sortedDurations.length - 1]);
  }

  // 98パーセンタイル値を計算
  const index = Math.floor(sortedDurations.length * 0.98);
  return Math.round(sortedDurations[index]);
}

/**
 * INP計測を開始
 * @param {Function} onUpdate - INP値が更新されたときのコールバック
 * @returns {Object} { reset, stop, getCurrentINP } - 計測を制御する関数
 */
function startINPMonitor(onUpdate) {
  // 状態をクロージャで管理
  let interactions = new Map(); // interactionId -> 最大duration
  let allDurations = []; // すべてのインタラクションのduration
  let observer = null;

  // ブラウザがEvent Timing APIをサポートしているか確認
  if (!PerformanceObserver.supportedEntryTypes?.includes('event')) {
    console.error('Event Timing API is not supported');
    return { reset: () => {}, stop: () => {}, getCurrentINP: () => null };
  }

  // PerformanceEventTiming エントリを処理
  function processEntry(entry) {
    // interactionId が 0 または undefined の場合はスキップ
    if (!entry.interactionId) {
      return;
    }

    const interactionId = entry.interactionId;
    const duration = entry.duration;

    // 同じ interactionId の最大 duration を記録
    const currentMax = interactions.get(interactionId) || 0;
    if (duration > currentMax) {
      interactions.set(interactionId, duration);

      // duration のリストを更新
      const existingIndex = allDurations.findIndex(
        d => d.interactionId === interactionId
      );

      if (existingIndex >= 0) {
        allDurations[existingIndex] = { interactionId, duration };
      } else {
        allDurations.push({ interactionId, duration });
      }
    }

    // INP値を計算
    const inp = calculateINP(allDurations);
    if (onUpdate && inp !== null) {
      onUpdate(inp);
    }
  }

  observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      processEntry(entry);
    }
  });

  observer.observe({
    type: 'event',
    buffered: true
  });

  // 計測をリセット
  function reset() {
    interactions.clear();
    allDurations = [];
    if (onUpdate) {
      onUpdate(null);
    }
  }

  // 計測を停止
  function stop() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  // 現在のINP値を取得
  function getCurrentINP() {
    return calculateINP(allDurations);
  }

  return { reset, stop, getCurrentINP };
}

// 使用例
const monitorControls = startINPMonitor((inp) => {
  console.log(`Current INP: ${inp}ms`);
});

// 計測をリセットする場合
// monitorControls.reset();

// 計測を停止する場合
// monitorControls.stop();
```

## INP値の計算方法

### 基本的な考え方

INP（Interaction to Next Paint）は、ページ上のすべてのインタラクションの中で代表的な応答性を示す指標です。

### 計算ロジック

1. **すべてのインタラクションのdurationを収集**
   - 各`interactionId`ごとに最大の`duration`を記録

2. **パーセンタイル値の計算**
   - インタラクション数が**50未満**の場合: **最大値**を使用
   - インタラクション数が**50以上**の場合: **98パーセンタイル値**を使用

3. **98パーセンタイル値の計算方法**

```javascript
// durationを昇順にソート
const sortedDurations = durations.sort((a, b) => a - b);

// 98パーセンタイルのインデックスを計算
const index = Math.floor(sortedDurations.length * 0.98);

// 98パーセンタイル値を取得
const inp = sortedDurations[index];
```

**例:**
- インタラクション数が100の場合
  - `index = Math.floor(100 * 0.98) = 98`
  - 98番目（0始まりなので99個目）の値がINPとなる
  - つまり、上位2%の遅いインタラクションを除外

### INPの評価基準

| レーティング | 範囲 | 意味 |
|-------------|------|------|
| **Good** | 0 〜 200ms | 優れた応答性 |
| **Needs Improvement** | 200 〜 500ms | 改善が必要 |
| **Poor** | 500ms 以上 | 不十分な応答性 |

## ブラウザサポート

- **PerformanceObserver API**: すべてのモダンブラウザでサポート
- **Event Timing API**: Chrome 76+, Edge 79+, Safari 16.4+ でサポート

サポート確認方法:

```javascript
if (PerformanceObserver.supportedEntryTypes?.includes('event')) {
  console.log('Event Timing API is supported');
} else {
  console.log('Event Timing API is not supported');
}
```

## 参考リンク

### 仕様・標準

- [Event Timing API - W3C Draft](https://w3c.github.io/event-timing/)
- [Performance Observer API - W3C Recommendation](https://w3c.github.io/performance-timeline/)

### MDN ドキュメント

- [PerformanceObserver - MDN](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver)
- [PerformanceEventTiming - MDN](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceEventTiming)

### web.dev

- [Interaction to Next Paint (INP)](https://web.dev/inp/)
- [Optimize INP](https://web.dev/optimize-inp/)
- [Debug INP](https://web.dev/debug-inp/)

### ツール

- [Chrome DevTools Performance Insights](https://developer.chrome.com/docs/devtools/performance-insights/)
- [WebPageTest](https://www.webpagetest.org/)
