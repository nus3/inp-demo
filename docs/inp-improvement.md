# INP の改善アプローチ

このドキュメントでは、デモサイトで実装されている「悪いINP」のパターンに対する具体的な改善アプローチを説明します。

## 目次

- [1. ブロッキング処理の改善](#1-ブロッキング処理の改善)
- [2. 大量のDOM操作の改善](#2-大量のdom操作の改善)
- [3. 重い同期計算の改善](#3-重い同期計算の改善)
- [改善の優先順位](#改善の優先順位)

---

## 1. ブロッキング処理の改善

### 問題点

```javascript
// 悪い例: 250msのブロッキング処理
button.addEventListener('click', () => {
  const startTime = performance.now();
  while (performance.now() - startTime < 250) {
    // メインスレッドをブロック
  }
  button.textContent = '処理完了！';
});
```

**INPへの影響**: メインスレッドが250msブロックされ、その間ユーザーの操作に応答できない。

### 改善アプローチ

#### アプローチ 1: setTimeout による処理の分割

```javascript
// 改善例: 処理を分割して yield を作る
button.addEventListener('click', () => {
  button.textContent = '処理中...';

  setTimeout(() => {
    // 処理を実行
    heavyTask();
    button.textContent = '処理完了！';
  }, 0);
});
```

**効果**: イベントハンドラーが即座に完了し、UIが素早く応答する。

#### アプローチ 2: requestIdleCallback の使用

```javascript
button.addEventListener('click', () => {
  button.textContent = '処理中...';

  requestIdleCallback(() => {
    heavyTask();
    button.textContent = '処理完了！';
  });
});
```

**効果**: ブラウザのアイドル時間に処理を実行し、ユーザー体験を損なわない。

#### アプローチ 3: 処理の最適化

そもそも250msかかる処理が必要かを再検討し、不要な処理を削減する。

---

## 2. 大量のDOM操作の改善

### 問題点

```javascript
// 悪い例: 1000個のDOM要素を一度に生成
button.addEventListener('click', () => {
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 1000; i++) {
    const div = document.createElement('div');
    div.className = 'dom-item';
    div.textContent = `要素 #${i + 1}`;
    fragment.appendChild(div);
  }
  container.appendChild(fragment);
});
```

**INPへの影響**: 大量のDOM操作がメインスレッドをブロックし、レンダリングに時間がかかる。

### 改善アプローチ

#### アプローチ 1: 仮想スクロール (Virtual Scrolling)

```javascript
// 改善例: 表示されている要素のみをレンダリング
const VISIBLE_ITEMS = 20;
const ITEM_HEIGHT = 40;

button.addEventListener('click', () => {
  // 最初の20個のみレンダリング
  renderVisibleItems(0, VISIBLE_ITEMS);

  // スクロールイベントで追加レンダリング
  container.addEventListener('scroll', () => {
    const scrollTop = container.scrollTop;
    const startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
    renderVisibleItems(startIndex, startIndex + VISIBLE_ITEMS);
  });
});
```

**効果**: レンダリングする要素数を減らし、初期表示を高速化。

#### アプローチ 2: requestAnimationFrame で分割レンダリング

```javascript
// 改善例: 処理を分割して少しずつレンダリング
const CHUNK_SIZE = 50;

button.addEventListener('click', () => {
  let rendered = 0;

  function renderChunk() {
    const fragment = document.createDocumentFragment();
    const end = Math.min(rendered + CHUNK_SIZE, 1000);

    for (let i = rendered; i < end; i++) {
      const div = document.createElement('div');
      div.className = 'dom-item';
      div.textContent = `要素 #${i + 1}`;
      fragment.appendChild(div);
    }

    container.appendChild(fragment);
    rendered = end;

    if (rendered < 1000) {
      requestAnimationFrame(renderChunk);
    }
  }

  renderChunk();
});
```

**効果**: 50個ずつレンダリングすることで、メインスレッドのブロック時間を短縮。

#### アプローチ 3: CSS contain プロパティの活用

```css
.dom-item {
  contain: layout style paint;
}
```

**効果**: ブラウザに要素が独立していることを伝え、レンダリングを最適化。

---

## 3. 重い同期計算の改善

### 問題点

```javascript
// 悪い例: 重いフィボナッチ計算を同期的に実行
button.addEventListener('click', () => {
  const result = fibonacci(40); // メインスレッドをブロック
  resultDiv.textContent = `結果: ${result}`;
});

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
```

**INPへの影響**: 数百〜数千msの同期処理がメインスレッドをブロック。

### 改善アプローチ

#### アプローチ 1: Web Worker の使用

```javascript
// 改善例: Web Worker で計算をオフロード
// worker.js
self.addEventListener('message', (e) => {
  const result = fibonacci(e.data);
  self.postMessage(result);
});

// main.js
const worker = new Worker('worker.js');

button.addEventListener('click', () => {
  button.textContent = '計算中...';

  worker.postMessage(40);
  worker.addEventListener('message', (e) => {
    resultDiv.textContent = `結果: ${e.data}`;
    button.textContent = '重い計算を実行';
  }, { once: true });
});
```

**効果**: メインスレッドをブロックせず、UIの応答性を維持。

#### アプローチ 2: メモ化による最適化

```javascript
// 改善例: メモ化で計算量を削減
const memo = new Map();

function fibonacciMemo(n) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);

  const result = fibonacciMemo(n - 1) + fibonacciMemo(n - 2);
  memo.set(n, result);
  return result;
}

button.addEventListener('click', () => {
  const result = fibonacciMemo(40); // 大幅に高速化
  resultDiv.textContent = `結果: ${result}`;
});
```

**効果**: 計算時間を劇的に短縮（指数時間 → 線形時間）。

#### アプローチ 3: イテレーティブな実装

```javascript
// 改善例: 再帰をループに変換
function fibonacciIterative(n) {
  if (n <= 1) return n;
  let prev = 0, curr = 1;

  for (let i = 2; i <= n; i++) {
    [prev, curr] = [curr, prev + curr];
  }

  return curr;
}

button.addEventListener('click', () => {
  const result = fibonacciIterative(40); // 高速
  resultDiv.textContent = `結果: ${result}`;
});
```

**効果**: スタックオーバーフローを防ぎ、計算を高速化。

---

## 改善の優先順位

### 1. 即座に視覚的フィードバックを提供

ユーザーがクリックした瞬間に、何らかの視覚的フィードバック（ローディング表示など）を提供する。

```javascript
button.addEventListener('click', () => {
  // 即座にUIを更新
  button.textContent = '処理中...';
  button.disabled = true;

  // 重い処理は非同期で
  setTimeout(() => {
    heavyTask();
    button.textContent = '完了';
    button.disabled = false;
  }, 0);
});
```

### 2. 処理を分割する

50ms以上かかる処理は分割し、メインスレッドに yield ポイントを作る。

**目安**: 各チャンクは50ms以内に完了するようにする。

### 3. バックグラウンド処理に移動

CPU集約的な処理は Web Worker で実行する。

### 4. 処理を最適化する

アルゴリズムの見直しや不要な処理の削減を行う。

---

## INP改善の効果測定

改善前後でINPを計測し、効果を確認する:

1. **改善前**: デモサイトで「悪いINP」のボタンをクリックし、INP値を確認
2. **改善実装**: 上記のアプローチを適用
3. **改善後**: 再度INP値を計測し、200ms以下（Good）を目指す

### 目標値

- **Good**: 200ms以下
- **Needs Improvement**: 200〜500ms
- **Poor**: 500ms以上

---

## 参考リンク

- [Optimize INP - web.dev](https://web.dev/optimize-inp/)
- [Long Tasks API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Long_Tasks_API)
- [Web Workers API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [requestIdleCallback - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback)
