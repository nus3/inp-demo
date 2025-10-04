# Long Tasks API と Long Animation Frames API

このドキュメントでは、Long Tasks API と Long Animation Frames API について説明します。これらのAPIは、Webページのパフォーマンスボトルネックを特定するための強力なツールです。

## 目次

- [Long Tasks API](#long-tasks-api)
  - [概要](#概要)
  - [基本的な使い方](#基本的な使い方)
  - [取得できる情報](#取得できる情報)
  - [ブラウザサポート](#ブラウザサポート)
- [Long Animation Frames API](#long-animation-frames-api)
  - [概要](#概要-1)
  - [Long Tasks API との違い](#long-tasks-api-との違い)
  - [基本的な使い方](#基本的な使い方-1)
  - [取得できる情報](#取得できる情報-1)
  - [フレームのタイムライン構造](#フレームのタイムライン構造)
  - [Frame Timings（フレームタイミング）](#frame-timingsフレームタイミング)
  - [ブラウザサポート](#ブラウザサポート-1)
- [実践的な使用例](#実践的な使用例)
- [参考リンク](#参考リンク)

---

## Long Tasks API

### 概要

**Long Tasks API** は、メインスレッドを 50ms 以上占有するタスク（ロングタスク）を検出するためのAPIです。

#### なぜ 50ms なのか？

- ブラウザは約 16.67ms（60fps）ごとにフレームを描画します
- 50ms 以上のタスクは、3フレーム以上をブロックすることを意味します
- これにより、ユーザーインタラクションの応答性が著しく低下します

#### INP との関連性

Long Tasks は、INP（Interaction to Next Paint）スコアの悪化の主な原因の一つです。ロングタスクが実行中の場合:

- ユーザー入力が遅延する（入力遅延の増加）
- イベントハンドラーの実行が遅延する
- 次のフレームの描画が遅延する

### 基本的な使い方

```javascript
// PerformanceObserver を作成
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('Long Task detected:', {
      name: entry.name,
      startTime: entry.startTime,
      duration: entry.duration
    });
  }
});

// 'longtask' タイプのエントリを監視
observer.observe({
  type: 'longtask',
  buffered: true  // ページロード時のタスクも取得
});
```

### 取得できる情報

Long Tasks API で取得できる主なプロパティ:

| プロパティ | 説明 | 型 |
|-----------|------|-----|
| `name` | タスクの種類（通常は 'self' または 'same-origin'） | string |
| `startTime` | タスク開始時刻（ミリ秒） | number |
| `duration` | タスクの実行時間（ミリ秒、50ms以上） | number |
| `attribution` | タスクの起因情報（配列） | array |

#### attribution の詳細

`attribution` プロパティには、タスクの起因に関する情報が含まれます:

```javascript
entry.attribution.forEach(attr => {
  console.log({
    name: attr.name,                    // 起因の種類
    containerType: attr.containerType,  // コンテナタイプ（iframe など）
    containerSrc: attr.containerSrc,    // コンテナのソースURL
    containerId: attr.containerId,      // コンテナのID
    containerName: attr.containerName   // コンテナの名前
  });
});
```

### ブラウザサポート

| ブラウザ | サポート状況 |
|---------|------------|
| Chrome | 58+ ✅ |
| Edge | 79+ ✅ |
| Firefox | ❌ |
| Safari | ❌ |

#### サポート確認方法

```javascript
if (PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
  console.log('Long Tasks API is supported');
} else {
  console.log('Long Tasks API is not supported');
}
```

---

## Long Animation Frames API

### 概要

**Long Animation Frames API (LoAF)** は、アニメーションフレーム全体のパフォーマンスを詳細に計測するためのAPIです。Long Tasks API よりも包括的で詳細な情報を提供します。

### Long Tasks API との違い

| 特徴 | Long Tasks API | Long Animation Frames API |
|-----|---------------|-------------------------|
| 粒度 | タスク単位 | フレーム単位 |
| タイミング情報 | 基本的（開始時刻、実行時間） | 詳細（レンダリング、スタイル/レイアウト） |
| スクリプト情報 | 限定的 | 詳細（呼び出し元、ソースURL） |
| デバッグ情報 | 少ない | 豊富 |

### 基本的な使い方

```javascript
// PerformanceObserver を作成
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('Long Animation Frame:', {
      duration: entry.duration,
      blockingDuration: entry.blockingDuration,
      renderStart: entry.renderStart,
      styleAndLayoutStart: entry.styleAndLayoutStart
    });
  }
});

// 'long-animation-frame' タイプのエントリを監視
observer.observe({
  type: 'long-animation-frame',
  buffered: true
});
```

### 取得できる情報

Long Animation Frames API で取得できる主なプロパティ:

| プロパティ | 説明 | 型 |
|-----------|------|-----|
| `startTime` | フレーム開始時刻（ミリ秒） | number |
| `duration` | フレーム全体の実行時間（ミリ秒） | number |
| `renderStart` | レンダリング開始時刻（ミリ秒） | number |
| `styleAndLayoutStart` | スタイル・レイアウト計算開始時刻（ミリ秒） | number |
| `blockingDuration` | ブロッキング時間（ミリ秒） | number |
| `firstUIEventTimestamp` | 最初のUIイベントがキューに入った時刻 | number \| null |
| `scripts` | スクリプト実行の詳細情報（配列） | array |

#### scripts プロパティの詳細

`scripts` 配列には、フレーム内で実行された各スクリプトの詳細情報が含まれます:

```javascript
entry.scripts.forEach(script => {
  console.log({
    name: script.name,                          // スクリプト名
    startTime: script.startTime,                // 実行開始時刻
    duration: script.duration,                  // 実行時間
    invoker: script.invoker,                    // 呼び出し元
    sourceURL: script.sourceURL,                // ソースファイルのURL
    sourceFunctionName: script.sourceFunctionName,  // 関数名
    sourceCharPosition: script.sourceCharPosition   // ソース内の文字位置
  });
});
```

### フレームのタイムライン構造

Long Animation Frames は、以下のフェーズに分かれています:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Animation Frame                           │
├─────────────────┬─────────────────┬──────────────────────────────┤
│   Script Phase  │  Render Phase   │  Style & Layout Phase        │
└─────────────────┴─────────────────┴──────────────────────────────┘
startTime      renderStart    styleAndLayoutStart      startTime+duration
```

#### 各フェーズの説明

1. **Script Phase (スクリプトフェーズ)**
   - JavaScript の実行
   - イベントハンドラーの処理
   - タイマーコールバックの実行

2. **Render Phase (レンダリングフェーズ)**
   - `requestAnimationFrame` コールバックの実行
   - レンダリング準備

3. **Style & Layout Phase (スタイル・レイアウトフェーズ)**
   - CSS スタイルの計算
   - レイアウトの計算
   - ペイント処理

#### 各フェーズの処理時間を計算

```javascript
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    const {startTime, duration, renderStart, styleAndLayoutStart} = entry;

    // 各フェーズの処理時間を計算
    const scriptDuration = renderStart - startTime;
    const renderDuration = styleAndLayoutStart - renderStart;
    const styleLayoutDuration = (startTime + duration) - styleAndLayoutStart;

    console.log('フェーズ別処理時間:');
    console.log(`  スクリプト: ${scriptDuration.toFixed(2)}ms`);
    console.log(`  レンダリング: ${renderDuration.toFixed(2)}ms`);
    console.log(`  スタイル/レイアウト: ${styleLayoutDuration.toFixed(2)}ms`);
    console.log(`  合計: ${duration.toFixed(2)}ms`);
  }
});

observer.observe({ type: 'long-animation-frame', buffered: true });
```

### Frame Timings（フレームタイミング）

Chrome の公式ドキュメントに基づく詳細なフレーム計測方法です。

#### Frame Timings のプロパティ

| タイミング | 計算方法 | 説明 |
|-----------|---------|------|
| **Start Time** | `startTime` | フレーム開始時刻 |
| **End Time** | `startTime + duration` | フレーム終了時刻 |
| **Work Duration** | `renderStart ? renderStart - startTime : duration` | レンダリング前の作業時間（スクリプト実行など） |
| **Render Duration** | `renderStart ? (startTime + duration) - renderStart : 0` | レンダリング全体の時間 |
| **Pre-layout Duration** | `styleAndLayoutStart ? styleAndLayoutStart - renderStart : 0` | レイアウト前の処理時間（requestAnimationFrame など） |
| **Style & Layout Duration** | `styleAndLayoutStart ? (startTime + duration) - styleAndLayoutStart : 0` | スタイル・レイアウト処理時間 |

#### Frame Timings の計算例

```javascript
/**
 * Frame timings を計算
 */
function calculateFrameTimings(entry) {
  const startTime = entry.startTime;
  const duration = entry.duration;
  const renderStart = entry.renderStart || 0;
  const styleAndLayoutStart = entry.styleAndLayoutStart || 0;

  return {
    // Start Time: フレーム開始時刻
    startTime: startTime,

    // End Time: フレーム終了時刻
    endTime: startTime + duration,

    // Work Duration: レンダリング前の作業時間
    workDuration: renderStart ? renderStart - startTime : duration,

    // Render Duration: レンダリング全体の時間
    renderDuration: renderStart ? (startTime + duration) - renderStart : 0,

    // Pre-layout Duration: レイアウト前の処理時間
    preLayoutDuration: styleAndLayoutStart ? styleAndLayoutStart - renderStart : 0,

    // Style & Layout Duration: スタイル・レイアウト処理時間
    styleAndLayoutDuration: styleAndLayoutStart ? (startTime + duration) - styleAndLayoutStart : 0
  };
}

// 使用例
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    const timings = calculateFrameTimings(entry);

    console.log('Frame Timings:');
    console.log(`  Start Time: ${timings.startTime}ms`);
    console.log(`  End Time: ${timings.endTime}ms`);
    console.log(`  Work Duration: ${timings.workDuration}ms`);
    console.log(`  Render Duration: ${timings.renderDuration}ms`);
    console.log(`  Pre-layout Duration: ${timings.preLayoutDuration}ms`);
    console.log(`  Style & Layout Duration: ${timings.styleAndLayoutDuration}ms`);

    // ボトルネックの特定
    if (timings.workDuration > 100) {
      console.warn('⚠️ スクリプト実行が遅い');
    }
    if (timings.styleAndLayoutDuration > 50) {
      console.warn('⚠️ スタイル・レイアウト処理が遅い');
    }
  }
});

observer.observe({ type: 'long-animation-frame', buffered: true });
```

#### Frame Timings の活用方法

Frame Timings を使用することで、フレーム内のどの部分がパフォーマンスボトルネックになっているかを正確に特定できます：

1. **Work Duration が長い場合**
   - スクリプト実行が遅い
   - タスクの分割や非同期処理を検討

2. **Pre-layout Duration が長い場合**
   - `requestAnimationFrame` コールバックが重い
   - アニメーションロジックの最適化を検討

3. **Style & Layout Duration が長い場合**
   - スタイル計算やレイアウト計算が遅い
   - レイアウトスラッシングの可能性
   - CSS の最適化を検討

### ブラウザサポート

| ブラウザ | サポート状況 |
|---------|------------|
| Chrome | 123+ ✅ |
| Edge | 123+ ✅ |
| Firefox | ❌ |
| Safari | ❌ |

#### サポート確認方法

```javascript
if (PerformanceObserver.supportedEntryTypes?.includes('long-animation-frame')) {
  console.log('Long Animation Frames API is supported');
} else {
  console.log('Long Animation Frames API is not supported');
}
```

---

## 実践的な使用例

### 1. INP 問題の診断

Long Animation Frames API を使用して、INP の問題を詳細に診断できます:

```javascript
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // ブロッキング時間が長いフレームを特定
    if (entry.blockingDuration > 200) {
      console.warn('⚠️ 長いブロッキング時間を検出:', {
        blockingDuration: entry.blockingDuration,
        totalDuration: entry.duration
      });

      // 各フェーズの時間を分析
      const scriptTime = entry.renderStart - entry.startTime;
      const styleLayoutTime = (entry.startTime + entry.duration) - entry.styleAndLayoutStart;

      if (scriptTime > 100) {
        console.log('→ スクリプト実行が遅い:', scriptTime, 'ms');
      }
      if (styleLayoutTime > 100) {
        console.log('→ スタイル/レイアウト計算が遅い:', styleLayoutTime, 'ms');
      }

      // 遅いスクリプトを特定
      entry.scripts.forEach(script => {
        if (script.duration > 50) {
          console.log('→ 遅いスクリプト:', {
            name: script.name,
            duration: script.duration,
            invoker: script.invoker
          });
        }
      });
    }
  }
});

observer.observe({ type: 'long-animation-frame', buffered: true });
```

### 2. パフォーマンスボトルネックの特定

Long Tasks と Long Animation Frames を組み合わせて使用:

```javascript
// Long Tasks で大まかな問題を特定
const longTasksObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('Long Task detected:', entry.duration, 'ms');
  }
});
longTasksObserver.observe({ type: 'longtask', buffered: true });

// LoAF で詳細を分析
const loafObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // 詳細な分析を実施
    analyzeFrame(entry);
  }
});
loafObserver.observe({ type: 'long-animation-frame', buffered: true });

function analyzeFrame(entry) {
  const phases = {
    script: entry.renderStart - entry.startTime,
    render: entry.styleAndLayoutStart - entry.renderStart,
    styleLayout: (entry.startTime + entry.duration) - entry.styleAndLayoutStart
  };

  // 最も時間がかかっているフェーズを特定
  const slowestPhase = Object.entries(phases)
    .sort((a, b) => b[1] - a[1])[0];

  console.log('最も遅いフェーズ:', slowestPhase[0], '=', slowestPhase[1], 'ms');
}
```

### 3. スタイル・レイアウト処理時間の監視

特にスタイルとレイアウトの計算時間を監視:

```javascript
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    const styleLayoutDuration =
      (entry.startTime + entry.duration) - entry.styleAndLayoutStart;

    if (styleLayoutDuration > 50) {
      console.warn('⚠️ スタイル/レイアウト処理が遅い:', {
        duration: styleLayoutDuration,
        totalFrameDuration: entry.duration,
        percentage: ((styleLayoutDuration / entry.duration) * 100).toFixed(1) + '%'
      });

      // スタイル/レイアウトを引き起こしたスクリプトを特定
      const triggeringScripts = entry.scripts.filter(script =>
        script.name.includes('style') || script.name.includes('layout')
      );

      if (triggeringScripts.length > 0) {
        console.log('原因スクリプト:', triggeringScripts);
      }
    }
  }
});

observer.observe({ type: 'long-animation-frame', buffered: true });
```

### 4. 実運用での監視

本番環境でパフォーマンスデータを収集:

```javascript
class PerformanceMonitor {
  constructor() {
    this.longTasks = [];
    this.longFrames = [];
    this.setupObservers();
  }

  setupObservers() {
    // Long Tasks の監視
    if (PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
      const longTasksObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.longTasks.push({
            duration: entry.duration,
            startTime: entry.startTime,
            timestamp: Date.now()
          });
        }
      });
      longTasksObserver.observe({ type: 'longtask', buffered: true });
    }

    // Long Animation Frames の監視
    if (PerformanceObserver.supportedEntryTypes?.includes('long-animation-frame')) {
      const loafObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.longFrames.push({
            duration: entry.duration,
            blockingDuration: entry.blockingDuration,
            phases: {
              script: entry.renderStart - entry.startTime,
              render: entry.styleAndLayoutStart - entry.renderStart,
              styleLayout: (entry.startTime + entry.duration) - entry.styleAndLayoutStart
            },
            timestamp: Date.now()
          });
        }
      });
      loafObserver.observe({ type: 'long-animation-frame', buffered: true });
    }
  }

  // 定期的にデータを分析サーバーに送信
  sendToAnalytics() {
    if (this.longTasks.length > 0 || this.longFrames.length > 0) {
      fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          longTasks: this.longTasks,
          longFrames: this.longFrames,
          userAgent: navigator.userAgent,
          url: location.href
        })
      });

      // データをクリア
      this.longTasks = [];
      this.longFrames = [];
    }
  }
}

// 使用例
const monitor = new PerformanceMonitor();

// 30秒ごとにデータを送信
setInterval(() => {
  monitor.sendToAnalytics();
}, 30000);
```

---

## 参考リンク

### 公式ドキュメント

- [Long Animation Frames API - Chrome Developers](https://developer.chrome.com/docs/web-platform/long-animation-frames)
- [Find slow interactions in the field - web.dev](https://web.dev/articles/find-slow-interactions-in-the-field)
- [Long Tasks API - W3C](https://w3c.github.io/longtasks/)

### MDN ドキュメント

- [PerformanceObserver - MDN](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver)
- [PerformanceLongTaskTiming - MDN](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceLongTaskTiming)

### 関連記事

- [Optimize INP - web.dev](https://web.dev/optimize-inp/)
- [Interaction to Next Paint (INP) - web.dev](https://web.dev/inp/)
- [User-centric Performance Metrics - web.dev](https://web.dev/user-centric-performance-metrics/)

### ツール

- [Chrome DevTools Performance Insights](https://developer.chrome.com/docs/devtools/performance-insights/)
- [WebPageTest](https://www.webpagetest.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
