/**
 * ブラウザサポート確認モジュール
 *
 * Long Tasks API と Long Animation Frames API のブラウザサポートを確認します。
 * これらのAPIは現在 Chromium ベースのブラウザ（Chrome, Edge）でのみサポートされています。
 */

/**
 * Long Tasks API のサポート確認
 *
 * Long Tasks API は 50ms 以上メインスレッドを占有するタスクを検出します。
 *
 * ブラウザサポート:
 * - Chrome 58+
 * - Edge 79+
 * - Firefox/Safari: 未対応
 *
 * @returns {boolean} サポートされている場合は true
 */
export function isLongTasksAPISupported() {
  return PerformanceObserver.supportedEntryTypes?.includes('longtask') || false;
}

/**
 * Long Animation Frames API のサポート確認
 *
 * Long Animation Frames API は、アニメーションフレーム全体のパフォーマンスを
 * 詳細に計測します。Long Tasks API よりも詳細な情報を提供します。
 *
 * ブラウザサポート:
 * - Chrome 123+
 * - Edge 123+
 * - Firefox/Safari: 未対応
 *
 * @returns {boolean} サポートされている場合は true
 */
export function isLoAFAPISupported() {
  return PerformanceObserver.supportedEntryTypes?.includes('long-animation-frame') || false;
}

/**
 * 現在のブラウザが Chromium ベースかどうかを判定
 *
 * この判定は完全に正確ではありませんが、警告表示の目安として使用します。
 *
 * @returns {boolean} Chromium ベースの可能性が高い場合は true
 */
export function isLikelyChromiumBased() {
  // Chrome または Edge の User Agent を持つ場合
  const ua = navigator.userAgent;
  return ua.includes('Chrome') || ua.includes('Edg');
}

/**
 * サポート状況の詳細を取得
 *
 * @returns {Object} サポート状況の詳細
 */
export function getBrowserSupportInfo() {
  return {
    longTasks: isLongTasksAPISupported(),
    loaf: isLoAFAPISupported(),
    isChromiumBased: isLikelyChromiumBased(),
    userAgent: navigator.userAgent
  };
}
