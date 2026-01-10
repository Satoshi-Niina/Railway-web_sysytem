"use client";

import { useEffect } from 'react';
import { init } from '../../lib/dev-error-panel/src';

/**
 * 開発環境のみエラーパネルを初期化するコンポーネント
 */
export default function DevToolInitializer() {
  useEffect(() => {
    // クライアントサイドでのみ実行
    if (process.env.NODE_ENV === 'development') {
      init({
        showUI: true
      });
    }
  }, []);

  return null; // UIは init() 内で DOM に直接マウントされるため、ここでは何も返さない
}
