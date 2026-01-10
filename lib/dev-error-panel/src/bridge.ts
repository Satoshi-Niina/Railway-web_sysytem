/**
 * 既存アプリからの段階的移行用ブリッジ
 * 
 * 使い方:
 * 1. 既存の console.error(msg) を devLogger.error(msg) に置換します。
 * 2. この時点では挙動は console.error と変わりません。
 * 3. モジュールの init() が呼ばれると、自動的にログパネルにも表示されるようになります。
 */

export const devLogger = {
  error: (message: string, ...args: any[]) => {
    // 常に console.error を呼ぶ（既存の挙動を維持）
    console.error(message, ...args);
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(message, ...args);
  },

  log: (message: string, ...args: any[]) => {
    console.log(message, ...args);
  }
};
