/**
 * Demo Handlers - 良いINPと悪いINPのデモ用イベントハンドラー
 */

/**
 * 良いINPの例: シンプルなカウンター
 * 軽量な処理のみで即座に応答
 */
export function setupGoodCounter() {
  const button = document.getElementById('good-counter');
  const countSpan = document.getElementById('good-count');
  let count = 0;

  button?.addEventListener('click', () => {
    count++;
    countSpan.textContent = count;
  });
}

/**
 * 良いINPの例: 色の変更
 * 即座に視覚的フィードバックを提供
 */
export function setupGoodColor() {
  const button = document.getElementById('good-color');
  const colors = [
    '#2563eb', // blue
    '#16a34a', // green
    '#dc2626', // red
    '#9333ea', // purple
    '#ea580c', // orange
  ];

  button?.addEventListener('click', (e) => {
    const currentIndex = parseInt(e.target.dataset.colorIndex || '0');
    const nextIndex = (currentIndex + 1) % colors.length;
    e.target.style.backgroundColor = colors[nextIndex];
    e.target.dataset.colorIndex = nextIndex;
  });
}

/**
 * 悪いINPの例: 重いブロッキング処理
 * メインスレッドを長時間ブロックする
 */
export function setupBadBlocking() {
  const button = document.getElementById('bad-blocking');

  button?.addEventListener('click', () => {
    // 約250msのブロッキング処理
    const startTime = performance.now();
    while (performance.now() - startTime < 250) {
      // 空ループでメインスレッドをブロック
    }
    button.textContent = '処理完了！';
    setTimeout(() => {
      button.textContent = '重い処理を実行（約250ms）';
    }, 1000);
  });
}

/**
 * 悪いINPの例: 大量のDOM操作
 * 一度に大量のDOM要素を生成
 */
export function setupBadDOM() {
  const button = document.getElementById('bad-dom');
  const container = document.getElementById('dom-container');

  button?.addEventListener('click', () => {
    // 既存の要素をクリア
    container.innerHTML = '';

    // 1000個のDOM要素を一度に生成
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 1000; i++) {
      const div = document.createElement('div');
      div.className = 'dom-item';
      div.textContent = `要素 #${i + 1}`;
      fragment.appendChild(div);
    }

    container.appendChild(fragment);
    button.textContent = '1000個の要素を生成しました';
    setTimeout(() => {
      button.textContent = '1000個の要素を生成';
    }, 2000);
  });
}

/**
 * 悪いINPの例: 複雑な同期計算
 * フィボナッチ数列の計算を同期的に実行
 */
export function setupBadCalculation() {
  const button = document.getElementById('bad-calculation');
  const resultDiv = document.getElementById('calculation-result');

  button?.addEventListener('click', () => {
    button.textContent = '計算中...';
    resultDiv.textContent = '';

    // 重いフィボナッチ数列の計算（同期処理）
    const n = 40; // 十分に重い計算
    const startTime = performance.now();
    const result = fibonacci(n);
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    resultDiv.textContent = `fib(${n}) = ${result} (計算時間: ${duration}ms)`;
    button.textContent = '重い計算を実行';
  });
}

/**
 * フィボナッチ数列を計算（非効率的な再帰実装）
 * @param {number} n
 * @returns {number}
 */
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
