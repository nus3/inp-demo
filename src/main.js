/**
 * Main Entry Point
 */

import { startINPMonitor, getINPRating } from './inp-monitor.js';
import {
  setupGoodCounter,
  setupGoodColor,
  setupBadBlocking,
  setupBadDOM,
  setupBadCalculation
} from './demo-handlers.js';

// INPモニターの制御関数を保持
let inpMonitorControls = null;

/**
 * UIを更新
 * @param {number|null} inp - INP値
 * @param {Array} interactions - インタラクション詳細のリスト
 */
function updateUI(inp, interactions) {
  const inpValueEl = document.getElementById('inp-value');
  const inpRatingEl = document.getElementById('inp-rating');

  if (inp === null) {
    inpValueEl.textContent = '--';
    inpRatingEl.textContent = '計測待機中';
    inpRatingEl.className = 'inp-rating';
  } else {
    inpValueEl.textContent = inp;

    const { rating, label } = getINPRating(inp);
    inpRatingEl.textContent = `${label} (${inp}ms)`;
    inpRatingEl.className = `inp-rating ${rating}`;
  }

  // インタラクション履歴を更新
  updateInteractionsList(interactions);
}

/**
 * インタラクション履歴を更新
 * @param {Array} interactions
 */
function updateInteractionsList(interactions) {
  const container = document.getElementById('interactions-container');

  if (!interactions || interactions.length === 0) {
    container.innerHTML = '<p class="empty-message">まだインタラクションがありません</p>';
    return;
  }

  // 最新のものから表示（逆順）
  const sortedInteractions = [...interactions].reverse();

  container.innerHTML = sortedInteractions.map(interaction => `
    <div class="interaction-item">
      <div class="interaction-info">
        <div class="interaction-name">${interaction.name} (ID: ${interaction.id})</div>
        <div class="interaction-time">
          ${interaction.timestamp} |
          処理時間: ${interaction.processingEnd - interaction.processingStart}ms |
          ターゲット: ${interaction.target}
        </div>
      </div>
      <div class="interaction-duration">${interaction.duration}ms</div>
    </div>
  `).join('');
}

/**
 * リセットボタンのセットアップ
 */
function setupResetButton() {
  const resetBtn = document.getElementById('reset-btn');
  resetBtn?.addEventListener('click', () => {
    if (inpMonitorControls) {
      inpMonitorControls.reset();
    }
  });
}

/**
 * 初期化
 */
function init() {
  // INP計測を開始
  inpMonitorControls = startINPMonitor(updateUI);

  // リセットボタンをセットアップ
  setupResetButton();

  // デモハンドラーをセットアップ
  setupGoodCounter();
  setupGoodColor();
  setupBadBlocking();
  setupBadDOM();
  setupBadCalculation();

  console.log('INP Demo initialized');
  console.log('PerformanceObserver is monitoring interactions...');
}

// DOMContentLoaded で初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
