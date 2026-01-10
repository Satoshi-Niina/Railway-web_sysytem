import { ErrorEntry, ErrorListener } from '../types';

/**
 * エラー状態を管理するシングルトンストア
 */
class ErrorStore {
  private errors: ErrorEntry[] = [];
  private listeners: Set<ErrorListener> = new Set();
  private maxErrors = 50;

  addError(error: Omit<ErrorEntry, 'id' | 'timestamp'>) {
    const entry: ErrorEntry = {
      ...error,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
    };

    this.errors = [entry, ...this.errors].slice(0, this.maxErrors);
    this.notify();
  }

  getErrors(): ErrorEntry[] {
    return [...this.errors];
  }

  subscribe(listener: ErrorListener) {
    this.listeners.add(listener);
    // 初回通知
    listener(this.getErrors());
    return () => this.listeners.delete(listener);
  }

  clear() {
    this.errors = [];
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.getErrors()));
  }
}

export const errorStore = new ErrorStore();
