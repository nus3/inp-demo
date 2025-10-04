/**
 * INP Monitor - PerformanceObserver API を使用したINP計測
 *
 * 使用するWeb API:
 * - PerformanceObserver: パフォーマンスイベントを監視
 * - Event Timing API: インタラクションのタイミング情報を取得
 */

/**
 * INP値のレーティングを取得
 * @param {number} inp - INP値（ミリ秒）
 * @returns {Object} { rating: 'good'|'needs-improvement'|'poor', label: string }
 */
export function getINPRating(inp) {
  if (inp === null || inp === undefined) {
    return { rating: 'unknown', label: '計測待機中' };
  }

  if (inp <= 200) {
    return { rating: 'good', label: 'Good' };
  } else if (inp <= 500) {
    return { rating: 'needs-improvement', label: 'Needs Improvement' };
  } else {
    return { rating: 'poor', label: 'Poor' };
  }
}

/**
 * INP値を計算
 * INPは、全インタラクションの duration の 98パーセンタイル値
 * インタラクション数が50未満の場合は最大値を使用
 *
 * @param {Array} allDurations - すべてのインタラクションのdurationリスト
 * @returns {number|null} INP値（ミリ秒）
 */
export function calculateINP(allDurations) {
  if (allDurations.length === 0) {
    return null;
  }

  // duration でソート
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
 * インタラクションの詳細情報を作成
 * @param {PerformanceEventTiming} entry
 * @returns {Object} インタラクション詳細
 */
function createInteractionDetail(entry) {
  return {
    id: entry.interactionId,
    name: entry.name,
    duration: Math.round(entry.duration),
    startTime: Math.round(entry.startTime),
    processingStart: Math.round(entry.processingStart),
    processingEnd: Math.round(entry.processingEnd),
    target: entry.target?.tagName || 'unknown',
    timestamp: new Date().toLocaleTimeString('ja-JP')
  };
}

/**
 * インタラクション詳細リストを更新
 * @param {Array} interactionDetails - 現在の詳細リスト
 * @param {Object} newDetail - 新しい詳細情報
 * @returns {Array} 更新された詳細リスト
 */
function updateInteractionDetails(interactionDetails, newDetail) {
  const existingIndex = interactionDetails.findIndex(
    d => d.id === newDetail.id
  );

  if (existingIndex >= 0) {
    // 既存のエントリを更新
    return [
      ...interactionDetails.slice(0, existingIndex),
      newDetail,
      ...interactionDetails.slice(existingIndex + 1)
    ];
  } else {
    // 新規追加
    return [...interactionDetails, newDetail];
  }
}

/**
 * duration リストを更新
 * @param {Array} allDurations - 現在の duration リスト
 * @param {number} interactionId - インタラクションID
 * @param {number} duration - duration値
 * @returns {Array} 更新された duration リスト
 */
function updateDurations(allDurations, interactionId, duration) {
  const existingIndex = allDurations.findIndex(
    d => d.interactionId === interactionId
  );

  if (existingIndex >= 0) {
    // 既存のエントリを更新
    return [
      ...allDurations.slice(0, existingIndex),
      { interactionId, duration },
      ...allDurations.slice(existingIndex + 1)
    ];
  } else {
    // 新規追加
    return [...allDurations, { interactionId, duration }];
  }
}

/**
 * INP計測を開始
 * @param {Function} onUpdate - INP値が更新されたときのコールバック (inp, interactionDetails) => void
 * @returns {Object} { reset, stop, getCurrentINP } - 計測を制御する関数
 */
export function startINPMonitor(onUpdate) {
  // 状態をクロージャで管理
  let interactions = new Map(); // interactionId -> 最大duration
  let allDurations = []; // すべてのインタラクションのduration
  let interactionDetails = []; // インタラクションの詳細情報
  let observer = null;

  // PerformanceObserver で 'event' タイプを監視
  // 'event' タイプは Event Timing API で定義されているエントリ
  if (!PerformanceObserver.supportedEntryTypes?.includes('event')) {
    console.error('Event Timing API is not supported in this browser');
    return { reset: () => {}, stop: () => {}, getCurrentINP: () => null };
  }

  /**
   * PerformanceEventTiming エントリを処理
   * @param {PerformanceEventTiming} entry
   */
  function processEntry(entry) {
    // interactionId が 0 の場合は、インタラクションとしてカウントされない
    // （例: hover イベントなど）
    if (!entry.interactionId) {
      return;
    }

    const interactionId = entry.interactionId;
    const duration = entry.duration;

    // 同じ interactionId の中で最大の duration を記録
    // （一つのインタラクションが複数のイベントを持つ場合がある）
    const currentMax = interactions.get(interactionId) || 0;
    if (duration > currentMax) {
      interactions.set(interactionId, duration);

      // duration リストを更新
      allDurations = updateDurations(allDurations, interactionId, duration);

      // インタラクション詳細を更新
      const detail = createInteractionDetail(entry);
      interactionDetails = updateInteractionDetails(interactionDetails, detail);
    }

    // INP値を計算して更新
    const inp = calculateINP(allDurations);
    if (onUpdate && inp !== null) {
      onUpdate(inp, interactionDetails);
    }
  }

  observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      processEntry(entry);
    }
  });

  // buffered: true で、監視開始前のイベントも取得
  observer.observe({
    type: 'event',
    buffered: true
  });

  // 計測をリセット
  function reset() {
    interactions.clear();
    allDurations = [];
    interactionDetails = [];

    if (onUpdate) {
      onUpdate(null, []);
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

  return {
    reset,
    stop,
    getCurrentINP
  };
}
