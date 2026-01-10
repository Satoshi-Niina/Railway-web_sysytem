import { setupObservers } from './core/observers';
import { mountUI } from './ui';
import { errorStore } from './core/store';

/**
 * モジュール初期化オプション
 */
interface InitOptions {
  enabled?: boolean;
  showUI?: boolean;
}

/**
 * 開発専用エラーパネルの初期化
 * 
 * init() を呼ばない限り副作用（グローバル汚染、イベント監視）は発生しません。
 */
export function init(options: InitOptions = {}) {
  // デフォルトで開発環境のみ有効
  const isDev = process.env.NODE_ENV === 'development';
  const enabled = options.enabled ?? isDev;

  if (!enabled) return;

  // 1. エラー監視の開始
  setupObservers();

  // 2. UIの表示（オプション）
  if (options.showUI !== false) {
    // スタイルの動的注入（CSSファイルを別途importしなくて済むように）
    // 本来はビルドプロセスで解決すべきだが、ここでは完結性を優先
    mountUI();
  }

  console.log('🚀 Dev Error Panel initialized.');
}

// StoreやBridgeを再公開
export { errorStore } from './core/store';
export { devLogger } from './bridge';
export type { ErrorEntry, ErrorType } from './types';
