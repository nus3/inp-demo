/**
 * Main Entry Point
 */

import { startINPMonitor, getINPRating } from './inp-monitor.js';
import {
  setupGoodCounter,
  setupGoodColor,
  setupBadBlocking,
  setupBadDOM,
  setupBadCalculation,
  setupBadLayout,
  setupBadStyleCalc
} from './demo-handlers.js';
import {
  isLongTasksAPISupported,
  isLoAFAPISupported,
  isLikelyChromiumBased
} from './browser-support.js';
import { startLongTasksMonitor } from './long-tasks-monitor.js';
import { startLoAFMonitor } from './loaf-monitor.js';

// INPモニターの制御関数を保持
let inpMonitorControls = null;
let longTasksMonitorControls = null;
let loafMonitorControls = null;

// Long Tasks と LoAF の状態
let isLongTasksMonitoring = false;
let isLoAFMonitoring = false;
let longTasksCount = 0;
let loafCount = 0;

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
 * ブラウザサポートチェックと警告表示
 */
function checkBrowserSupport() {
  const warningEl = document.getElementById('api-support-warning');
  const longTasksBtn = document.getElementById('toggle-longtasks');
  const loafBtn = document.getElementById('toggle-loaf');

  const longTasksSupported = isLongTasksAPISupported();
  const loafSupported = isLoAFAPISupported();
  const isChromium = isLikelyChromiumBased();

  // Long Tasks のボタン状態を設定
  if (longTasksSupported) {
    longTasksBtn.disabled = false;
  }

  // LoAF のボタン状態を設定
  if (loafSupported) {
    loafBtn.disabled = false;
  }

  // 警告バナーの表示
  if (!isChromium) {
    warningEl.innerHTML = `
      <p>
        <strong>警告:</strong> Long Tasks API と Long Animation Frames API は、
        Chromium ベースのブラウザ（Chrome, Edge）でのみ利用可能です。
        現在のブラウザでは利用できない可能性があります。
      </p>
    `;
    warningEl.style.display = 'block';
  } else if (!longTasksSupported && !loafSupported) {
    warningEl.innerHTML = `
      <p>
        <strong>情報:</strong> これらのAPIはサポートされていません。
        Chrome 58+ または Edge 79+ をご使用ください。
      </p>
    `;
    warningEl.style.display = 'block';
  }
}

/**
 * Long Task アイテムをHTMLとして生成
 */
function createLongTaskHTML(task) {
  return `
    <div class="task-item">
      <div class="task-item-header">
        <span class="task-item-name">${task.name}</span>
        <span class="task-item-time">${task.timestamp}</span>
      </div>
      <div class="task-item-stats">
        <div class="task-stat">
          <span class="task-stat-label">開始時刻:</span>
          <span class="task-stat-value">${task.startTime}ms</span>
        </div>
        <div class="task-stat">
          <span class="task-stat-label">実行時間:</span>
          <span class="task-stat-value">${task.duration}ms</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * LoAF アイテムをHTMLとして生成
 */
function createLoAFHTML(loaf) {
  const scriptsHTML = loaf.scripts.length > 0
    ? `
      <div class="loaf-scripts">
        <div class="loaf-scripts-title">スクリプト実行 (最大5件)</div>
        ${loaf.scripts.map(script => `
          <div class="loaf-script">
            <div class="loaf-script-name">${script.name || 'unknown'}</div>
            <div>実行時間: <span class="loaf-script-duration">${script.duration}ms</span></div>
            ${script.invoker ? `<div style="font-size: 0.75rem; color: var(--color-secondary);">呼び出し元: ${script.invoker}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `
    : '';

  // Frame timings の表示
  const frameTimingsHTML = loaf.frameTimings ? `
    <div class="loaf-frame-timings">
      <div class="loaf-frame-timings-title">
        Frame Timings
        <span class="info-tooltip" title="Chrome の公式ドキュメントに基づく詳細なフレーム計測">ℹ️</span>
      </div>
      <div class="frame-timings-grid">
        <div class="frame-timing-item">
          <span class="frame-timing-label">Start Time:</span>
          <span class="frame-timing-value">${loaf.frameTimings.startTime}ms</span>
        </div>
        <div class="frame-timing-item">
          <span class="frame-timing-label">End Time:</span>
          <span class="frame-timing-value">${loaf.frameTimings.endTime}ms</span>
        </div>
        <div class="frame-timing-item">
          <span class="frame-timing-label">Work Duration:</span>
          <span class="frame-timing-value">${loaf.frameTimings.workDuration}ms</span>
          <span class="frame-timing-desc">レンダリング前の作業時間</span>
        </div>
        <div class="frame-timing-item">
          <span class="frame-timing-label">Render Duration:</span>
          <span class="frame-timing-value">${loaf.frameTimings.renderDuration}ms</span>
          <span class="frame-timing-desc">レンダリング全体の時間</span>
        </div>
        <div class="frame-timing-item">
          <span class="frame-timing-label">Pre-layout Duration:</span>
          <span class="frame-timing-value">${loaf.frameTimings.preLayoutDuration}ms</span>
          <span class="frame-timing-desc">レイアウト前の処理時間</span>
        </div>
        <div class="frame-timing-item">
          <span class="frame-timing-label">Style & Layout Duration:</span>
          <span class="frame-timing-value">${loaf.frameTimings.styleAndLayoutDuration}ms</span>
          <span class="frame-timing-desc">スタイル・レイアウト処理時間</span>
        </div>
      </div>
    </div>
  ` : '';

  return `
    <div class="loaf-item">
      <div class="loaf-item-header">
        <span class="loaf-item-duration">全体: ${loaf.duration}ms (ブロッキング: ${loaf.blockingDuration}ms)</span>
        <span class="loaf-item-time">${loaf.timestamp}</span>
      </div>
      <div class="loaf-timeline">
        <div class="loaf-timeline-title">タイムライン（簡易版）</div>
        <div class="loaf-phases">
          <div class="loaf-phase">
            <div class="loaf-phase-label">スクリプト</div>
            <div class="loaf-phase-value">${loaf.phases.script}ms</div>
          </div>
          <div class="loaf-phase">
            <div class="loaf-phase-label">レンダリング</div>
            <div class="loaf-phase-value">${loaf.phases.render}ms</div>
          </div>
          <div class="loaf-phase">
            <div class="loaf-phase-label">スタイル/レイアウト</div>
            <div class="loaf-phase-value">${loaf.phases.styleLayout}ms</div>
          </div>
        </div>
      </div>
      ${frameTimingsHTML}
      ${scriptsHTML}
    </div>
  `;
}

/**
 * Long Tasks の監視を開始/停止
 */
function toggleLongTasksMonitoring() {
  const btn = document.getElementById('toggle-longtasks');
  const listEl = document.getElementById('longtasks-list');

  if (!isLongTasksMonitoring) {
    // 監視開始
    longTasksCount = 0;
    listEl.innerHTML = '<div class="empty-list-message">Long Task を検出待機中...</div>';

    longTasksMonitorControls = startLongTasksMonitor((task) => {
      longTasksCount++;
      document.getElementById('longtasks-count').textContent = longTasksCount;

      // リストの先頭に追加（最新のものが上に表示される）
      const existingContent = listEl.innerHTML;
      if (existingContent.includes('empty-list-message')) {
        listEl.innerHTML = '';
      }
      listEl.insertAdjacentHTML('afterbegin', createLongTaskHTML(task));
    });

    isLongTasksMonitoring = true;
    btn.textContent = '監視停止';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
  } else {
    // 監視停止
    if (longTasksMonitorControls) {
      longTasksMonitorControls.stop();
      longTasksMonitorControls = null;
    }

    isLongTasksMonitoring = false;
    btn.textContent = '監視開始';
    btn.classList.remove('btn-secondary');
    btn.classList.add('btn-primary');
  }
}

/**
 * LoAF の監視を開始/停止
 */
function toggleLoAFMonitoring() {
  const btn = document.getElementById('toggle-loaf');
  const listEl = document.getElementById('loaf-list');

  if (!isLoAFMonitoring) {
    // 監視開始
    loafCount = 0;
    listEl.innerHTML = '<div class="empty-list-message">Long Animation Frame を検出待機中...</div>';

    loafMonitorControls = startLoAFMonitor((loaf) => {
      loafCount++;
      document.getElementById('loaf-count').textContent = loafCount;

      // リストの先頭に追加（最新のものが上に表示される）
      const existingContent = listEl.innerHTML;
      if (existingContent.includes('empty-list-message')) {
        listEl.innerHTML = '';
      }
      listEl.insertAdjacentHTML('afterbegin', createLoAFHTML(loaf));
    });

    isLoAFMonitoring = true;
    btn.textContent = '監視停止';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
  } else {
    // 監視停止
    if (loafMonitorControls) {
      loafMonitorControls.stop();
      loafMonitorControls = null;
    }

    isLoAFMonitoring = false;
    btn.textContent = '監視開始';
    btn.classList.remove('btn-secondary');
    btn.classList.add('btn-primary');
  }
}

/**
 * Long Tasks と LoAF のボタンをセットアップ
 */
function setupAPIMonitorButtons() {
  const longTasksBtn = document.getElementById('toggle-longtasks');
  const loafBtn = document.getElementById('toggle-loaf');

  longTasksBtn?.addEventListener('click', toggleLongTasksMonitoring);
  loafBtn?.addEventListener('click', toggleLoAFMonitoring);
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
  setupBadLayout();
  setupBadStyleCalc();

  // ブラウザサポートチェック
  checkBrowserSupport();

  // Long Tasks と LoAF のボタンをセットアップ
  setupAPIMonitorButtons();

  console.log('INP Demo initialized');
  console.log('PerformanceObserver is monitoring interactions...');
}

// DOMContentLoaded で初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
