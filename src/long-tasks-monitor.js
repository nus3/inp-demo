/**
 * Long Tasks Monitor - Long Tasks API を使用したロングタスク監視
 *
 * Long Tasks API は、50ms 以上メインスレッドを占有するタスクを検出します。
 * これらのタスクは、ユーザーインタラクションの応答性を低下させる可能性があります。
 *
 * 使用するWeb API:
 * - PerformanceObserver: パフォーマンスイベントを監視
 * - Long Tasks API: ロングタスクの情報を取得
 */

import { isLongTasksAPISupported } from './browser-support.js';

/**
 * Long Task の詳細情報を作成
 * @param {PerformanceLongTaskTiming} entry
 * @returns {Object} タスク詳細
 */
function createLongTaskDetail(entry) {
  return {
    name: entry.name,
    startTime: Math.round(entry.startTime),
    duration: Math.round(entry.duration),
    // attribution は常に存在するとは限らない
    attribution: entry.attribution?.map(attr => ({
      name: attr.name || 'unknown',
      containerType: attr.containerType || 'unknown',
      containerSrc: attr.containerSrc || '',
      containerId: attr.containerId || '',
      containerName: attr.containerName || ''
    })) || [],
    timestamp: new Date().toLocaleTimeString('ja-JP')
  };
}

/**
 * Long Tasks の監視を開始
 *
 * 50ms 以上メインスレッドを占有するタスクを検出し、
 * コールバック関数を通じて通知します。
 *
 * @param {Function} onLongTask - ロングタスク検出時のコールバック (taskDetail) => void
 * @returns {Object} { stop, getLongTasks } - 監視を制御する関数
 */
export function startLongTasksMonitor(onLongTask) {
  // 状態をクロージャで管理
  let longTasks = [];
  let observer = null;

  // ブラウザが Long Tasks API をサポートしているか確認
  if (!isLongTasksAPISupported()) {
    console.warn('Long Tasks API is not supported in this browser');
    return {
      stop: () => {},
      getLongTasks: () => []
    };
  }

  /**
   * PerformanceLongTaskTiming エントリを処理
   * @param {PerformanceLongTaskTiming} entry
   */
  function processEntry(entry) {
    const taskDetail = createLongTaskDetail(entry);
    longTasks.push(taskDetail);

    // コールバックを呼び出し
    if (onLongTask) {
      onLongTask(taskDetail);
    }
  }

  observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      processEntry(entry);
    }
  });

  // buffered: true で、監視開始前のタスクも取得
  observer.observe({
    type: 'longtask',
    buffered: true
  });

  // 監視を停止
  function stop() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  // 記録されたすべての Long Tasks を取得
  function getLongTasks() {
    return [...longTasks];
  }

  return {
    stop,
    getLongTasks
  };
}
