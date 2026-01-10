/**
 * エラー情報の型定義
 */
export type ErrorType = 'runtime' | 'promise' | 'console' | 'api';

export interface ErrorEntry {
  id: string;
  type: ErrorType;
  message: string;
  stack?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export type ErrorListener = (errors: ErrorEntry[]) => void;
