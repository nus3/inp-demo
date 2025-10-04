# INP計測の実装パターン

## PerformanceObserver を使った INP 計測

### 基本パターン

```javascript
// 関数ベースの実装（class構文を避ける）
function startINPMonitor(onUpdate) {
  let interactions = new Map(); // interactionId -> 最大duration
  let allDurations = [];

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.interactionId) return;

      const currentMax = interactions.get(entry.interactionId) || 0;
      if (entry.duration > currentMax) {
        interactions.set(entry.interactionId, entry.duration);
        // allDurations を更新
        const inp = calculateINP(allDurations);
        onUpdate(inp);
      }
    }
  });

  observer.observe({ type: 'event', buffered: true });

  return { reset: () => {}, stop: () => observer.disconnect() };
}
```

### 重要なポイント

1. **interactionId が 0 の場合はスキップ**
   - hoverイベントなどはinteractionIdが0

2. **同じ interactionId の最大 duration を使用**
   - 1つのインタラクションが複数イベント（pointerdown, pointerup, click）を持つ

3. **98パーセンタイル値の計算**
   ```javascript
   function calculateINP(durations) {
     const sorted = [...durations].sort((a, b) => a - b);
     if (sorted.length < 50) return sorted[sorted.length - 1];
     const index = Math.floor(sorted.length * 0.98);
     return sorted[index];
   }
   ```

## 状態管理パターン

- **class構文を避ける理由**: 暗黙的な内部状態を持つため
- **クロージャで状態管理**: 関数スコープで変数を保持

```javascript
function createCounter() {
  let count = 0; // クロージャで状態管理
  return {
    increment: () => ++count,
    get: () => count,
    reset: () => count = 0
  };
}
```

## よくあるエラー

### buffered オプションの欠落
```javascript
// ❌ 悪い例: 過去のイベントを取得できない
observer.observe({ type: 'event' });

// ✅ 良い例
observer.observe({ type: 'event', buffered: true });
```

### ブラウザサポートチェック
```javascript
if (!PerformanceObserver.supportedEntryTypes?.includes('event')) {
  console.error('Event Timing API is not supported');
  return;
}
```
