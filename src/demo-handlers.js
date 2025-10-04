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

/**
 * 悪いINPの例: レンダリング・スタイル/レイアウトに時間がかかる処理
 * レイアウトスラッシング（強制同期レイアウト）を引き起こす
 */
export function setupBadLayout() {
  const button = document.getElementById('bad-layout');
  const container = document.getElementById('layout-container');

  button?.addEventListener('click', () => {
    button.textContent = '処理中...';
    container.innerHTML = '';

    // より多くの要素を作成（500個）
    const elements = [];
    for (let i = 0; i < 500; i++) {
      const div = document.createElement('div');
      div.className = 'layout-item';
      div.textContent = `要素 #${i + 1}`;
      div.style.cssText = `
        padding: 10px;
        margin: 5px;
        border: 2px solid #2563eb;
        border-radius: 8px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      `;
      container.appendChild(div);
      elements.push(div);
    }

    // レイアウトスラッシング: 読み取りと書き込みを交互に複数回行う
    // これにより強制的にレイアウト再計算が大量に発生
    for (let round = 0; round < 3; round++) {
      elements.forEach((el, i) => {
        // 読み取り1（レイアウトを強制）
        const height = el.offsetHeight;
        const width = el.offsetWidth;
        const top = el.offsetTop;
        const left = el.offsetLeft;

        // 書き込み1（スタイル変更）
        el.style.height = `${height + (round * 2)}px`;
        el.style.width = `${width + (round * 2)}px`;
        el.style.backgroundColor = i % 2 === 0 ? '#f0f9ff' : '#fef3c7';

        // 読み取り2（再度レイアウトを強制）
        const computedStyle = getComputedStyle(el);
        const fontSize = computedStyle.fontSize;
        const padding = computedStyle.padding;

        // 書き込み2（追加のスタイル変更）
        el.style.fontSize = `${parseFloat(fontSize) * 1.05}px`;
        el.style.padding = `${parseFloat(padding) + 1}px`;

        // 読み取り3（さらにレイアウトを強制）
        const rect = el.getBoundingClientRect();

        // 書き込み3（位置情報に基づくスタイル変更）
        if (rect.top > 100) {
          el.style.transform = `translateY(-${round}px)`;
        }
      });
    }

    button.textContent = 'レイアウトスラッシング完了';
    setTimeout(() => {
      button.textContent = 'レイアウトスラッシングを実行';
    }, 2000);
  });
}

/**
 * 悪いINPの例: 複雑なスタイル計算
 * 複雑なCSSアニメーションとスタイル変更を大量に実行
 */
export function setupBadStyleCalc() {
  const button = document.getElementById('bad-style-calc');
  const container = document.getElementById('style-calc-container');

  button?.addEventListener('click', () => {
    button.textContent = '処理中...';
    container.innerHTML = '';

    // より多くの要素を作成（800個）
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 800; i++) {
      const div = document.createElement('div');
      div.className = 'style-calc-item';
      div.textContent = `${i + 1}`;

      // 複雑なスタイル設定
      div.style.cssText = `
        padding: 8px 12px;
        margin: 3px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
        transform: rotate(${i % 360}deg) scale(1);
        transition: all 0.3s ease;
        display: inline-block;
        font-weight: 600;
        font-size: 14px;
        filter: blur(0px) brightness(1);
      `;

      fragment.appendChild(div);
    }

    container.appendChild(fragment);

    // すべての要素にスタイル変更を複数回適用（スタイル再計算を強制）
    requestAnimationFrame(() => {
      const items = container.querySelectorAll('.style-calc-item');

      // 複数ラウンドのスタイル変更を実行
      for (let round = 0; round < 5; round++) {
        items.forEach((item, i) => {
          // 複雑なスタイル変更
          item.style.transform = `rotate(${(i * 10 + round * 20) % 360}deg) scale(${1 + round * 0.05})`;
          item.style.background = `linear-gradient(${i * 5 + round * 10}deg, #f093fb 0%, #f5576c 100%)`;
          item.style.boxShadow = `0 ${(i + round) % 10}px ${(i + round) % 20}px rgba(0, 0, 0, 0.2)`;
          item.style.filter = `blur(${round * 0.2}px) brightness(${1 + round * 0.1})`;
          item.style.borderRadius = `${12 + round * 2}px`;

          // スタイル読み取りを強制（getComputedStyle）
          const computed = getComputedStyle(item);
          const currentTransform = computed.transform;
          const currentBackground = computed.background;
        });
      }

      button.textContent = 'スタイル計算完了';
      setTimeout(() => {
        button.textContent = '複雑なスタイル計算を実行';
      }, 2000);
    });
  });
}
