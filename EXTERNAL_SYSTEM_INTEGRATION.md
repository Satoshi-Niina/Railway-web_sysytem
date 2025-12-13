# 外部システム連携設計メモ

## 概要
このシステムは将来的に他のシステムと連携することを想定しています。
特に、機種（vehicle_types）や機械番号（vehicles.machine_number）などのマスタデータは、
外部システムから取得または外部システムへ提供する可能性があります。

## 連携対象テーブル

### 1. master_data.vehicles（車両マスタ）
**連携項目:**
- `machine_number` (機械番号) - 外部システムの車両IDと連携
- `vehicle_type` (車種)
- `model` (型式)
- `manufacturer` (メーカー)

**連携方法の選択肢:**
1. **REST API経由での同期**
   - 外部システムから定期的にデータを取得
   - エンドポイント例: `GET /api/external/vehicles`
   
2. **データベース直接連携**
   - 外部システムのDBビューを参照
   - PostgreSQL Foreign Data Wrapper (FDW) の利用
   
3. **CSV/JSON一括インポート**
   - 定期的なバッチ処理でマスタを更新

### 2. master_data.vehicle_types（車種マスタ）
**連携項目:**
- `type_name` (車種名)
- `category` (カテゴリ)

**外部システムとの同期:**
- 外部システムの車種マスタと定期的に同期
- 新しい車種が追加された場合の自動取り込み

### 3. master_data.management_offices（事業所マスタ）
**連携項目:**
- `office_code` (事業所コード)
- `office_name` (事業所名)

**組織変更への対応:**
- 外部人事システムと連携して組織変更を反映

## データベース設計の拡張案

### 外部システム連携用カラムの追加

```sql
-- vehicles テーブルに外部システム連携用カラムを追加
ALTER TABLE master_data.vehicles ADD COLUMN IF NOT EXISTS external_system_id VARCHAR(50);
ALTER TABLE master_data.vehicles ADD COLUMN IF NOT EXISTS external_system_name VARCHAR(50);
ALTER TABLE master_data.vehicles ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_vehicles_external_system 
ON master_data.vehicles(external_system_id, external_system_name);

-- 同期履歴テーブルの作成
CREATE TABLE IF NOT EXISTS system_integration.sync_history (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    external_system_name VARCHAR(50) NOT NULL,
    sync_type VARCHAR(20) NOT NULL, -- 'import', 'export', 'bidirectional'
    records_processed INTEGER,
    records_success INTEGER,
    records_failed INTEGER,
    sync_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sync_completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL, -- 'running', 'completed', 'failed'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 外部システム連携用スキーマ

```sql
-- 外部システム連携専用スキーマ
CREATE SCHEMA IF NOT EXISTS system_integration;

-- 外部システム定義テーブル
CREATE TABLE system_integration.external_systems (
    id SERIAL PRIMARY KEY,
    system_name VARCHAR(50) UNIQUE NOT NULL,
    system_type VARCHAR(50) NOT NULL, -- 'vehicle_management', 'hr', 'inventory', etc.
    api_endpoint VARCHAR(255),
    api_key_encrypted TEXT,
    connection_method VARCHAR(20), -- 'api', 'database', 'file'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- データマッピングテーブル（フィールドマッピング定義）
CREATE TABLE system_integration.field_mappings (
    id SERIAL PRIMARY KEY,
    external_system_id INTEGER REFERENCES system_integration.external_systems(id),
    local_table VARCHAR(100) NOT NULL,
    local_field VARCHAR(100) NOT NULL,
    external_field VARCHAR(100) NOT NULL,
    transform_function VARCHAR(100), -- データ変換関数名
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## API設計案

### 外部システム向けAPIエンドポイント

```typescript
// GET /api/external/vehicles - 車両一覧取得
// GET /api/external/vehicles/:machine_number - 特定車両取得
// POST /api/external/vehicles/sync - 車両データ同期
// GET /api/external/vehicle-types - 車種一覧取得

// ミドルウェアで認証・認可を実装
// - APIキー認証
// - IP制限
// - レート制限
```

### 環境変数での外部システム設定

```env
# 外部システム連携設定
EXTERNAL_VEHICLE_SYSTEM_ENABLED=true
EXTERNAL_VEHICLE_SYSTEM_API_URL=https://external-vehicle-system.example.com/api
EXTERNAL_VEHICLE_SYSTEM_API_KEY=your_api_key_here
EXTERNAL_VEHICLE_SYSTEM_SYNC_INTERVAL=3600000  # 1時間ごと

# 外部人事システム連携
EXTERNAL_HR_SYSTEM_ENABLED=false
EXTERNAL_HR_SYSTEM_API_URL=https://hr-system.example.com/api
EXTERNAL_HR_SYSTEM_API_KEY=your_api_key_here
```

## 実装の優先順位

### Phase 1: 基礎準備（現在）
- ✅ 基本的なマスタテーブル構造の確立
- ✅ 環境変数による設定管理
- ✅ REST API基盤の構築

### Phase 2: 外部連携準備
- [ ] 外部システム連携用スキーマ追加
- [ ] 同期履歴テーブル作成
- [ ] APIキー認証機能の実装

### Phase 3: 具体的な連携実装
- [ ] 車両データ同期API実装
- [ ] 定期同期バッチ処理
- [ ] エラーハンドリングとリトライ機能

### Phase 4: 運用最適化
- [ ] 同期モニタリングダッシュボード
- [ ] 差分同期の実装
- [ ] コンフリクト解決機能

## 注意事項

1. **データ整合性**
   - 外部システムとの同期時は必ずトランザクションを使用
   - 同期失敗時のロールバック処理を実装

2. **パフォーマンス**
   - 大量データの同期は非同期処理で実行
   - 差分同期を優先（全件同期は避ける）

3. **セキュリティ**
   - APIキーは環境変数で管理、暗号化して保存
   - 外部システムとの通信はHTTPS必須
   - IP制限やレート制限を実装

4. **監視・ログ**
   - すべての同期処理はログに記録
   - エラー発生時のアラート機能
   - 同期履歴の定期的な監査

## 参考: 外部システム連携のコード例

```typescript
// scripts/sync-external-vehicles.ts
import { Pool } from 'pg';
import axios from 'axios';

interface ExternalVehicle {
  id: string;
  machineNumber: string;
  vehicleType: string;
  model: string;
  manufacturer: string;
}

export async function syncExternalVehicles() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // 外部APIから車両データ取得
    const response = await axios.get<ExternalVehicle[]>(
      process.env.EXTERNAL_VEHICLE_SYSTEM_API_URL + '/vehicles',
      {
        headers: {
          'Authorization': `Bearer ${process.env.EXTERNAL_VEHICLE_SYSTEM_API_KEY}`
        }
      }
    );
    
    const externalVehicles = response.data;
    
    // トランザクション開始
    const client = await pool.connect();
    await client.query('BEGIN');
    
    try {
      for (const vehicle of externalVehicles) {
        // UPSERT処理
        await client.query(`
          INSERT INTO master_data.vehicles (
            machine_number, vehicle_type, model, manufacturer, 
            external_system_id, external_system_name, last_synced_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
          ON CONFLICT (machine_number) 
          DO UPDATE SET 
            vehicle_type = EXCLUDED.vehicle_type,
            model = EXCLUDED.model,
            manufacturer = EXCLUDED.manufacturer,
            last_synced_at = NOW()
        `, [
          vehicle.machineNumber,
          vehicle.vehicleType,
          vehicle.model,
          vehicle.manufacturer,
          vehicle.id,
          'external_vehicle_system'
        ]);
      }
      
      await client.query('COMMIT');
      console.log(`✅ Synced ${externalVehicles.length} vehicles successfully`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Failed to sync vehicles:', error);
    throw error;
  } finally {
    await pool.end();
  }
}
```

## まとめ

このシステムは、将来的な外部システム連携を考慮した設計になっています。
現時点では基本的なマスタ管理機能を実装し、必要に応じて段階的に連携機能を追加していく方針です。

連携が必要になった時点で、このドキュメントを参考に実装を進めてください。
