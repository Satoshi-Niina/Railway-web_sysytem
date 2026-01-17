# ルーティングテーブル分析レポート

作成日: 2026-01-17

## 1. 概要

`public.app_resource_routing` テーブルは、複数のアプリケーションが共有データベースにアクセスする際に、論理リソース名から物理テーブル名へのマッピングを提供する。

## 2. 現状の構造

### 2.1 登録済みアプリ一覧

| app_id | エントリ数 | 用途（推定） |
|--------|-----------|------------|
| `railway-maintenance` | 17 | 運用管理システム（現在のアプリ） |
| `master_data` | 10 | マスタデータ管理 |
| `operations` | 4 | 運用管理 |
| `inspections` | 4 | 検査管理 |
| `maintenance` | 4 | 保守管理 |
| `operations_app` | 3 | 運用アプリ（別版？） |
| `maintenance_app` | 1 | 保守アプリ（別版？） |

### 2.2 スキーマ構成

| スキーマ | 用途 |
|---------|------|
| `master_data` | マスタデータ（車両、基地、事業所、機種等） |
| `operations` | 運用データ（計画、実績） |
| `inspections` | 検査データ（計画、実績） |
| `maintenance` | 保守データ（故障、修理） |
| `emergency` | 緊急対応（メッセージ） |
| `public` | システム管理（ルーティング等） |

## 3. 現状の課題

### 3.1 重複エントリ（同一テーブルが複数app_idに登録）

```
operation_records:
  - app_id: operations → operations.operation_records
  - app_id: railway-maintenance → operations.operation_records

operation_plans:
  - app_id: operations → operations.operation_plans
  - app_id: operations_app → operations.operation_plans
  - app_id: railway-maintenance → operations.operation_plans

inspection_types:
  - app_id: master_data → master_data.inspection_types
  - app_id: railway-maintenance → master_data.inspection_types

failures:
  - app_id: maintenance → maintenance.failures
  - app_id: railway-maintenance → maintenance.failures
```

**影響**: どのapp_idを使用するか不明確になり、メンテナンスが困難

### 3.2 大文字/小文字の不統一

```
同じテーブルへの重複エントリ:
- inspection_types と INSPECTION_TYPES
- operation_records と OPERATION_RECORDS
- VEHICLES と vehicles
- BASES と bases
```

**影響**: アプリによって論理名の指定方法が異なり、混乱の原因

### 3.3 アプリID命名の不統一

```
類似したapp_idが存在:
- operations と operations_app
- maintenance と maintenance_app
```

**影響**: どちらが正式なアプリか判別困難

### 3.4 ルーティング使用の不統一（railway-maintenanceアプリ内）

| ファイル | 接続方式 |
|---------|---------|
| `server/routes/operation-records.js` | ✅ `getTablePath()` 使用 |
| `server/routes/vehicles.js` | ❌ 直接 `master_data.vehicles` |
| `server/routes/bases.js` | ❌ 直接 `master_data.bases` |
| `server/routes/offices.js` | ❌ 直接 `master_data.management_offices` |
| `server/routes/machines.js` | ❌ 直接 `master_data.machines` |
| `server/routes/machine-types.js` | ❌ 直接 `master_data.machine_types` |
| `server/controllers/inspection.js` | ❌ 直接 `inspections.inspection_plans` |

**影響**: 一貫性がなく、ルーティング変更時に一部だけ反映される可能性

### 3.5 未使用の可能性があるエントリ

```
以下のエントリは使用されていない可能性:
- SCHEDULES → operations.schedules (テーブル存在確認必要)
- SUPPORT_FLOWS → operations.support_flows
- SUPPORT_HISTORY → operations.support_history
- FAULT_HISTORY → maintenance.fault_history
- FAULT_RECORDS → maintenance.fault_records
```

## 4. 整理方法の提案

### 4.1 方針A: アプリ単位でルーティングを分離（推奨）

各アプリは自分のapp_idのみ参照する。

```
例: railway-maintenance アプリ
→ app_id = 'railway-maintenance' のエントリのみ使用
→ 他のapp_idエントリは使用しない
```

**メリット**:
- 各アプリが独立してルーティングを管理可能
- 影響範囲が明確

### 4.2 方針B: 共通app_idに統一

すべてのアプリが共通のapp_id（例: `shared`）を参照。

**メリット**:
- エントリ数が減少
- メンテナンスが容易

**デメリット**:
- 1つのアプリの変更が全アプリに影響

### 4.3 方針C: ルーティングを廃止し直接指定

ルーティングテーブルを使用せず、各アプリで直接スキーマ.テーブル名を指定。

**メリット**:
- シンプル
- パフォーマンス良好

**デメリット**:
- スキーマ変更時は全アプリのコード修正が必要

## 5. 整理作業のステップ

### Step 1: 各アプリの確認
- [ ] 各アプリのリポジトリを特定
- [ ] 各アプリの `db-routing.js` または同等機能を確認
- [ ] 使用しているapp_idを確認

### Step 2: 使用状況の調査
- [ ] 各アプリで実際に使用されているルーティングエントリを特定
- [ ] 未使用エントリを特定

### Step 3: ルーティングテーブルのクリーンアップ
- [ ] 重複エントリの削除
- [ ] 大文字/小文字の統一（小文字推奨）
- [ ] 未使用エントリの削除

### Step 4: 各アプリのコード修正
- [ ] ルーティング使用/不使用の方針を決定
- [ ] 方針に従ってコードを統一

### Step 5: テスト・検証
- [ ] 各アプリの動作確認
- [ ] 本番環境へのデプロイ

## 6. railway-maintenance アプリの対応案

### 推奨: 直接指定に統一

理由:
1. 現在、大部分が直接指定で動作している
2. スキーマ構造が安定している
3. マルチテナントの予定がない

対応:
1. `operation-records.js` の `getTablePath()` を直接指定に変更
2. `db-routing.js` は将来の拡張用に残す
3. ルーティングテーブルの `railway-maintenance` エントリは残すが、積極的には使用しない

## 7. 次のアクション

1. **緊急**: 他の2つのアプリのリポジトリ・コードベースを確認
2. **短期**: 各アプリでのルーティング使用状況を調査
3. **中期**: ルーティングテーブルのクリーンアップ
4. **長期**: 全アプリで一貫した方針を適用

---

## 確認事項（ユーザーへのヒアリング）

1. 3つのアプリの名前とリポジトリの場所は？
2. 各アプリの担当者は？
3. ルーティングテーブルは必須機能か、将来的な拡張用か？
4. スキーマ構造の変更予定はあるか？
