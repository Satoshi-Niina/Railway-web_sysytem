# 開発ツールガイド

## 左下の「N」アイコン（Next.js Inspector）

### 概要
Next.js 15の開発モードで自動的に表示されるVercel製のインスペクターツールです。

### 主な機能

#### 1. ページ情報の確認
- 現在のルート: `/management`
- レンダリングタイプ: Server Component / Client Component
- 使用されているコンポーネント一覧

#### 2. パフォーマンス分析
- **初回ロード時間**: ページが最初に表示されるまでの時間
- **ハイドレーション時間**: Reactがクライアント側で制御を開始するまでの時間
- **コンポーネントレンダリング時間**: 各コンポーネントの処理時間

#### 3. データフェッチの追跡
- APIコールのタイミング
- データ取得の成功/失敗状態
- キャッシュの利用状況

### 使用方法

#### デバッグシナリオ例

**シナリオ1: エラーの原因特定**
```
1. エラーが発生
2. 「N」アイコンをクリック
3. エラーが発生したコンポーネントを特定
4. コンポーネント名をクリック → VS Codeで該当ファイルを開く
5. 修正
```

**シナリオ2: パフォーマンス問題の解決**
```
1. ページが遅いと感じる
2. 「N」アイコンで各コンポーネントのレンダリング時間を確認
3. 遅いコンポーネントを特定
4. useMemo、useCallbackなどで最適化
```

**シナリオ3: データフェッチの確認**
```
1. データが表示されない
2. 「N」アイコンでAPIコールの状態を確認
3. エラーメッセージやステータスコードを確認
4. API側の問題かクライアント側の問題か判断
```

### 本プロジェクトでの活用例

#### 運用管理表の最適化
```typescript
// 遅いコンポーネントを特定したら
// operation-management-chart.tsx

// Before: 毎回再計算
const vehiclesByType = getVehiclesByType()

// After: メモ化で最適化
const vehiclesByType = useMemo(() => {
  // 計算処理
}, [dependencies])
```

#### データ取得の追跡
```typescript
// fetchData関数の実行時間を確認
const fetchData = async () => {
  console.time('fetchData')
  // データ取得処理
  console.timeEnd('fetchData')
}
```

## その他の推奨開発ツール

### 1. React DevTools（ブラウザ拡張機能）
**インストール:**
- Chrome: [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- Edge: Microsoft Edge Add-onsから検索

**機能:**
- コンポーネントツリーの可視化
- Props/Stateの確認と編集
- レンダリング回数の追跡

### 2. VS Code拡張機能

#### 必須拡張機能
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "usernamehw.errorlens",
    "eamodio.gitlens",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

#### 設定例（.vscode/settings.json）
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### 3. ブラウザ開発者ツール

#### Networkタブの活用
```
1. F12キーで開発者ツールを開く
2. Networkタブを選択
3. XHR/Fetchフィルターを有効化
4. APIコールを監視
```

#### Consoleタブでのデバッグ
```javascript
// データ取得結果の確認
console.log("データ取得結果:", {
  vehicles: vehiclesData.length,
  bases: basesData.length,
  offices: officesData.length
})

// パフォーマンス測定
console.time('API Call')
await fetch('/api/vehicles')
console.timeEnd('API Call')
```

### 4. Lighthouse（パフォーマンス測定）

**使い方:**
1. F12 → Lighthouseタブ
2. "Analyze page load"をクリック
3. レポートを確認

**確認項目:**
- Performance Score
- Accessibility Score
- Best Practices Score
- SEO Score

## プロジェクト固有のデバッグコマンド

### データベース接続の確認
```bash
npm run test:db
```

### データベース構造の確認
```bash
npm run db:check
```

### 開発サーバーの再起動
```bash
# Ctrl+C で停止
npm run dev
```

## トラブルシューティング

### 「N」アイコンが表示されない場合

**原因1: 本番モードで起動している**
```bash
# 開発モードで起動
npm run dev

# ❌ 本番モードでは表示されない
npm run build
npm run start
```

**原因2: Next.jsのバージョンが古い**
```bash
# Next.jsのバージョン確認
npm list next

# アップデート
npm install next@latest
```

### パフォーマンスが悪い場合

**チェックリスト:**
- [ ] 不要なコンポーネントの再レンダリング
- [ ] APIコールの重複
- [ ] 大きな配列の非効率な処理
- [ ] メモ化の欠如

**最適化例:**
```typescript
// ❌ 悪い例: 毎回フィルタリング
const filteredData = allData.filter(item => condition)

// ✅ 良い例: メモ化
const filteredData = useMemo(() => 
  allData.filter(item => condition),
  [allData, condition]
)
```

## 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [React DevTools Guide](https://react.dev/learn/react-developer-tools)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [VS Code Tips](https://code.visualstudio.com/docs/getstarted/tips-and-tricks)

## まとめ

左下の「N」アイコンは、Next.jsプロジェクトの開発を効率化する強力なツールです。

**活用ポイント:**
1. エラー発生時の原因特定
2. パフォーマンスボトルネックの発見
3. コンポーネント構造の理解
4. VS Codeへの素早いアクセス

**他のプロジェクトでも活用可能:**
- Next.js 13以降を使用するすべてのプロジェクト
- Vercel上のプロジェクト
- React Server Componentsを使用するプロジェクト

開発効率を最大化するため、このツールを積極的に活用してください！
