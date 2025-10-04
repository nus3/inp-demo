/**
 * Long Animation Frames (LoAF) Monitor
 *
 * Long Animation Frames API は、アニメーションフレーム全体のパフォーマンスを
 * 詳細に計測します。Long Tasks API よりも包括的な情報を提供します。
 *
 * 使用するWeb API:
 * - PerformanceObserver: パフォーマンスイベントを監視
 * - Long Animation Frames API: フレームの詳細情報を取得
 */

import { isLoAFAPISupported } from './browser-support.js';

/**
 * Frame timings を計算
 * Chrome の公式ドキュメントに基づく計算
 * @param {PerformanceLongAnimationFrameTiming} entry
 * @returns {Object} Frame timings
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
    // renderStart が存在する場合は startTime から renderStart まで
    // 存在しない場合は全体の duration
    workDuration: renderStart ? renderStart - startTime : duration,

    // Render Duration: レンダリング全体の時間
    // renderStart が存在する場合は renderStart からフレーム終了まで
    renderDuration: renderStart ? (startTime + duration) - renderStart : 0,

    // Render: Pre-layout Duration: レンダリング開始からスタイル・レイアウト開始まで
    // styleAndLayoutStart が存在する場合は renderStart から styleAndLayoutStart まで
    preLayoutDuration: styleAndLayoutStart ? styleAndLayoutStart - renderStart : 0,

    // Render: Style and Layout Duration: スタイル・レイアウトの処理時間
    // styleAndLayoutStart が存在する場合は styleAndLayoutStart からフレーム終了まで
    styleAndLayoutDuration: styleAndLayoutStart ? (startTime + duration) - styleAndLayoutStart : 0
  };
}

/**
 * LoAF の詳細情報を作成
 * @param {PerformanceLongAnimationFrameTiming} entry
 * @returns {Object} フレーム詳細
 */
function createLoAFDetail(entry) {
  const startTime = entry.startTime;
  const duration = entry.duration;
  const renderStart = entry.renderStart;
  const styleAndLayoutStart = entry.styleAndLayoutStart;

  // 各フェーズの処理時間を計算（既存の計算方法）
  const scriptDuration = renderStart > 0 ? renderStart - startTime : 0;
  const renderDuration = (styleAndLayoutStart > 0 && renderStart > 0)
    ? styleAndLayoutStart - renderStart
    : 0;
  const styleLayoutDuration = styleAndLayoutStart > 0
    ? (startTime + duration) - styleAndLayoutStart
    : 0;

  // Frame timings を計算
  const frameTimings = calculateFrameTimings(entry);

  return {
    startTime: Math.round(startTime),
    duration: Math.round(duration),
    renderStart: Math.round(renderStart),
    styleAndLayoutStart: Math.round(styleAndLayoutStart),
    blockingDuration: Math.round(entry.blockingDuration || 0),
    firstUIEventTimestamp: entry.firstUIEventTimestamp
      ? Math.round(entry.firstUIEventTimestamp)
      : null,
    // 各フェーズの処理時間（簡易版）
    phases: {
      script: Math.round(scriptDuration),
      render: Math.round(renderDuration),
      styleLayout: Math.round(styleLayoutDuration)
    },
    // Frame timings（詳細版）
    frameTimings: {
      startTime: Math.round(frameTimings.startTime),
      endTime: Math.round(frameTimings.endTime),
      workDuration: Math.round(frameTimings.workDuration),
      renderDuration: Math.round(frameTimings.renderDuration),
      preLayoutDuration: Math.round(frameTimings.preLayoutDuration),
      styleAndLayoutDuration: Math.round(frameTimings.styleAndLayoutDuration)
    },
    // スクリプト実行の詳細（最大5件まで）
    scripts: (entry.scripts || []).slice(0, 5).map(script => ({
      name: script.name || 'unknown',
      startTime: Math.round(script.startTime),
      duration: Math.round(script.duration),
      invoker: script.invoker || '',
      sourceURL: script.sourceURL || '',
      sourceFunctionName: script.sourceFunctionName || '',
      sourceCharPosition: script.sourceCharPosition || -1
    })),
    timestamp: new Date().toLocaleTimeString('ja-JP')
  };
}

/**
 * Long Animation Frames の監視を開始
 *
 * 長時間実行されるアニメーションフレームを検出し、
 * 詳細な情報をコールバック関数を通じて通知します。
 *
 * @param {Function} onLoAF - LoAF検出時のコールバック (loafDetail) => void
 * @returns {Object} { stop, getLoAFs } - 監視を制御する関数
 */
export function startLoAFMonitor(onLoAF) {
  // 状態をクロージャで管理
  let loafs = [];
  let observer = null;

  // ブラウザが Long Animation Frames API をサポートしているか確認
  if (!isLoAFAPISupported()) {
    console.warn('Long Animation Frames API is not supported in this browser');
    return {
      stop: () => {},
      getLoAFs: () => []
    };
  }

  /**
   * PerformanceLongAnimationFrameTiming エントリを処理
   * @param {PerformanceLongAnimationFrameTiming} entry
   */
  function processEntry(entry) {
    const loafDetail = createLoAFDetail(entry);
    loafs.push(loafDetail);

    // コールバックを呼び出し
    if (onLoAF) {
      onLoAF(loafDetail);
    }
  }

  observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      processEntry(entry);
    }
  });

  // buffered: true で、監視開始前のフレームも取得
  observer.observe({
    type: 'long-animation-frame',
    buffered: true
  });

  // 監視を停止
  function stop() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  // 記録されたすべての LoAF を取得
  function getLoAFs() {
    return [...loafs];
  }

  return {
    stop,
    getLoAFs
  };
}
