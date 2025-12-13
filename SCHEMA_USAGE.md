# データベーススキーマ使用方針

## スキーマ構成

### 現在のアプリケーションで使用するスキーマ

1. **master_data** - マスタデータ
   - vehicles (車両)
   - management_offices (事業所)
   - bases (基地)
   - vehicle_types (車両タイプ)

2. **operations** - 運用管理
   - operation_plans (運用計画)
   - operation_records (運用実績)
   - travel_plans (出張計画)
   - travel_records (出張実績)

3. **inspections** - 検査管理
   - inspection_plans (検査計画)
   - inspection_records (検査実績)
   - inspection_items (検査項目)

4. **maintenance** - 保守管理
   - maintenance_plans (保守計画)
   - maintenance_records (保守実績)
   - monthly_maintenance_plans (月次保守計画)

### 現在のアプリケーションで使用しないスキーマ

- **public** - 別のアプリケーション用
  - このスキーマは削除しないが、現在のアプリケーションでは参照しない
  - 将来的に活用する可能性があるため保持

## APIルートとスキーマ対応表

### マスタデータ系API
- `/api/vehicles` → `master_data.vehicles`
- `/api/management-offices` → `master_data.management_offices`
- `/api/bases` → `master_data.bases`
- `/api/maintenance-bases` → `master_data.bases`
- `/api/vehicle-types` → `master_data.vehicle_types`

### 運用管理系API
- `/api/operation-plans` → `operations.operation_plans`
- `/api/operation-records` → `operations.operation_records`

### 検査系API
- `/api/inspections` → `inspections.*`
- `/api/inspection-plans` → `inspections.inspection_plans`

### 保守系API
- `/api/maintenance` → `maintenance.*`
- `/api/monthly-maintenance-plans` → `maintenance.monthly_maintenance_plans`

## 修正内容

2025年12月12日に以下の修正を実施：

1. すべてのAPIルートファイルから `public.*` スキーマへの参照を削除
2. マスタデータは `master_data.*` スキーマに統一
3. 運用データは `operations.*` スキーマに統一
4. 検査データは `inspections.*` スキーマに統一
5. 保守データは `maintenance.*` スキーマに統一

## 注意事項

- 新しいAPIを作成する際は、必ず適切なスキーマを指定すること
- `public` スキーマは絶対に使用しないこと
- データベース接続は `.env.local` の `DATABASE_URL` で `webappdb` に接続
