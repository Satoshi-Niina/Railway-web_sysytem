# Dev Error Panel (@dev-toolkit/error-panel)

開発環境専用のエラー監視・オーバーレイ表示モジュールです。

## 特徴
- **フレームワーク非依存**: 純粋な TypeScript/JavaScript で動作します。
- **副作用ゼロ**: `init()` を呼び出すまで、グローバル環境や既存コードへの影響はありません。
- **開発専用**: デフォルトで `NODE_ENV === 'development'` の場合のみ動作します。
- **簡単削除**: 呼び出し箇所を消すだけで、アプリから完全に痕跡を消せます。

## 導入手順

### 1. 初期化 (新規アプリの場合)
アプリのエントリーポイント（`main.tsx`, `index.ts`, `app/layout.tsx` など）で一度だけ呼び出します。

```typescript
import { init } from '@/lib/dev-error-panel/src';

// 開発環境のみ有効化（内部で自動判定されますが、明示も可能）
init({
  enabled: process.env.NODE_ENV === 'development',
  showUI: true
});
```

### 2. 段階的移行 (既存アプリの場合)

既存の `console.error` 等を壊さずに導入するステップ：

#### Step 1: ブリッジの利用
既存の `console.error` を呼んでいる箇所を、提供されている `devLogger` に差し替えます。
この時点では、標準のコンソール出力以外に何も起こりません。

```typescript
// Before
console.error("API Error", err);

// After
import { devLogger } from '@/lib/dev-error-panel/src';
devLogger.error("API Error", err);
```

#### Step 2: モジュールの初期化
`init()` を実行すると、`devLogger.error` で送られたエラーが自動的にパネルに表示されるようになります。

### 3. API エラーの監視
このモジュールは `fetch` を自動的にラップし、ステータスが `!ok` の場合にエラーを収集します。

## 完全削除手順

このモジュールをプロジェクトから削除したくなった場合は、以下の手順で安全に削除できます：

1. `init()` の呼び出しコードを削除する。
2. `lib/dev-error-panel` フォルダを削除する。
3. `devLogger` を使っていた箇所を `console` に戻す（または一括置換）。
   - 正規表現置換例: `devLogger\.error` -> `console.error`

## 安全性への配慮
- `init()` は `NODE_ENV === 'production'` では何も行いません。
- UI要素は `init()` 時に生成されるため、バンドルサイズ以外のランタイム・オーバーヘッドは本番環境では最小限です。
- グローバルな `console` や `fetch` のパッチは、元の関数を保存して必ず内部で呼び出すため、他のライブラリの動作を阻害しません。
