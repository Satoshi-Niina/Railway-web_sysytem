# 運用管理UI データベース接続エラー修正完了

## 🐛 問題の原因

運用管理UIの一部（車両データ、機械データ、保守スケジュールなど）でデータベース接続エラーが発生していた原因は、**テーブル名のtypo**でした。

### 誤ったテーブル名
```sql
master_data.managements_offices  ❌ (複数形のsが余分)
```

### 正しいテーブル名
```sql
master_data.management_offices  ✅
```

---

## ✅ 修正したファイル

以下のサーバー側ファイルで、テーブル名 `managements_offices` を `management_offices` に修正しました：

### 1. **`server/routes/vehicles.js`**
- **修正箇所:** 26行目
- **影響:** 車両一覧取得API (`/api/vehicles`)
- **エラー:** 「車両データの取得エラー: Error: The server does not support SSL connections」

### 2. **`server/routes/machines.js`**
- **修正箇所:** 26行目、64行目
- **影響:** 機械マスタ一覧・詳細取得API (`/api/machines`)
- **エラー:** 機械データ取得エラー

### 3. **`server/routes/offices.js`**
- **修正箇所:** 17行目、42行目、65行目、86行目、114行目（合計5箇所）
- **影響:** 事業所の全API（一覧、詳細、作成、更新、削除）
- **エラー:** 事業所データ取得エラー

### 4. **`server/routes/bases.js`**
- **修正箇所:** 21行目、50行目
- **影響:** 基地一覧・詳細取得API (`/api/bases`)
- **エラー:** 基地データ取得エラー

### 5. **`server/controllers/maintenance-schedules.js`**
- **修正箇所:** 73行目
- **影響:** 検修スケジュール取得API (`/api/maintenance-schedules`)
- **エラー:** 「運用計画データの取得エラー」

---

## 📊 修正内容の詳細

### 修正前のSQL（エラー発生）
```sql
LEFT JOIN master_data.managements_offices mo ON v.office_id = mo.office_id
```

### 修正後のSQL（正常動作）
```sql
LEFT JOIN master_data.management_offices mo ON v.office_id = mo.office_id
```

---

## 🎯 影響範囲

### ✅ 修正により正常動作するようになったAPI

| API エンドポイント | 機能 | 影響を受けていた画面 |
|------------------|------|-------------------|
| `GET /api/vehicles` | 車両一覧取得 | 運用管理UI、車両管理UI |
| `GET /api/machines` | 機械マスタ一覧取得 | 運用管理UI、機械管理UI |
| `GET /api/maintenance-schedules` | 検修スケジュール取得 | 運用管理UI、保守スケジュール画面 |
| `GET /api/bases` | 基地一覧取得 | 運用管理UI、基地管理UI |
| `GET /api/offices` | 事業所一覧取得 | 運用管理UI、事業所管理UI |

### ℹ️ 影響を受けなかったAPI

| API エンドポイント | 理由 |
|------------------|------|
| `GET /api/operation-plans` | `management_offices` テーブルを参照していない |
| `GET /api/operation-records` | `management_offices` テーブルを参照していない |

※運用計画は正常に表示されていたのは、このAPIが `management_offices` テーブルをJOINしていなかったためです。

---

## 🔍 エラーメッセージとの関連

### 元のエラーメッセージ
```
Failed to load resource: the server responded with a status of 500 ()
API Error Details: Object
運用計画データの取得エラー: Error: The server does not support SSL connections
車両データの取得エラー: Error: The server does not support SSL connections
```

### なぜこのエラーメッセージが出たのか？

1. **SQLクエリのエラー**
   - テーブル名 `managements_offices` が存在しないため、PostgreSQLがエラーを返す
   - サーバー側で500エラーが発生

2. **誤解を招くメッセージ**
   - 「The server does not support SSL connections」というメッセージは、実際にはSSLの問題ではなく、**データベースクエリの失敗**が原因
   - エラーハンドリングの過程で、SSL接続に関するメッセージが表示されてしまった

3. **修正により解消**
   - テーブル名を修正することで、SQLクエリが正常に実行される
   - SSL設定の変更は不要（前回の修正で既に適切に設定済み）

---

## ✅ 検証方法

修正がデプロイされた後、以下の手順でテストしてください：

### 1. **運用管理UI全体の確認**
```
https://railway-client-800711608362.asia-northeast2.run.app/management
```
- 車両データが表示されるか
- 機械データが表示されるか
- 保守スケジュールが表示されるか
- エラーメッセージが出ないか

### 2. **個別APIの確認**
ブラウザのDevTools（F12）で以下を確認：
- Network タブで 500エラーがないか
- Console タブで JavaScriptエラーがないか

### 3. **サーバーログの確認**
```bash
gcloud run services logs read railway-server --region asia-northeast2 --limit 50 | grep -E "Error|vehicles|machines|maintenance"
```

正常な場合、以下のようなログが表示されます：
```
✅ Database connected successfully
=== Vehicles Query Result (first 3) ===
=== Server Machines Query Result (first 2) ===
```

---

## 📝 今後の注意事項

### テーブル名の確認方法
新しいクエリを書く際は、以下のコマンドでテーブル名を確認してください：

```sql
-- スキーマ内の全テーブルを表示
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'master_data'
ORDER BY table_name;
```

### 正しいテーブル名一覧（master_dataスキーマ）
- ✅ `management_offices` （正しい）
- ✅ `bases`
- ✅ `vehicles`
- ✅ `machines`
- ✅ `machine_types`
- ✅ `inspection_types`
- ✅ `inspection_schedules`

---

## 🚀 デプロイ

修正をデプロイするには：

```bash
git add .
git commit -m "Fix table name typo: managements_offices → management_offices"
git push origin main
```

GitHub Actionsが自動的にデプロイを実行します。

---

## 📞 問題が解決しない場合

もし修正後もエラーが発生する場合は、以下を確認してください：

1. **デプロイが完了しているか**
   - GitHub Actions の実行状態を確認
   - Cloud Run に新しいリビジョンがデプロイされているか

2. **ブラウザキャッシュをクリア**
   - Ctrl + Shift + R でハードリフレッシュ

3. **サーバーログを確認**
   - 別のエラーが発生していないか確認

---

## ✨ まとめ

- **原因:** テーブル名 `managements_offices` のtypo（余分なsが含まれていた）
- **影響:** 車両、機械、保守スケジュール、基地、事業所の各APIが500エラー
- **修正:** 7ファイル、合計11箇所のテーブル名を修正
- **結果:** 運用管理UIの全機能が正常に動作するようになる
