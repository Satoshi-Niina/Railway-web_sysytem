# 鉄道保守システム データベース ER図

## 概要
このシステムは鉄道車両の保守管理、運用計画、検査管理、故障管理を統合的に行うシステムです。

## ER図

```mermaid
erDiagram
    %% 管理事業所
    management_offices {
        int id PK
        varchar office_name
        varchar office_code UK
        varchar station_1
        varchar station_2
        varchar station_3
        varchar station_4
        varchar station_5
        varchar station_6
        timestamp created_at
        timestamp updated_at
    }

    %% 保守基地
    maintenance_bases {
        int id PK
        varchar base_name
        varchar base_code UK
        int management_office_id FK
        varchar location
        text address
        timestamp created_at
        timestamp updated_at
    }

    %% 基地（旧テーブル）
    bases {
        int id PK
        varchar base_name
        varchar base_type
        varchar location
        int management_office_id FK
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    %% 車種
    vehicle_types {
        int id PK
        varchar type_name UK
        varchar category
        text description
        timestamp created_at
    }

    %% 車両
    vehicles {
        int id PK
        varchar machine_number UK
        varchar vehicle_type
        varchar model
        varchar manufacturer
        date acquisition_date
        int management_office_id FK
        int home_base_id FK
        int maintenance_base_id FK
        varchar status
        timestamp created_at
        timestamp updated_at
    }

    %% 検査種別
    inspection_types {
        int id PK
        varchar type_name
        varchar category
        int interval_days
        text description
        timestamp created_at
    }

    %% 運用計画
    operation_plans {
        int id PK
        int vehicle_id FK
        date plan_date
        varchar shift_type
        int departure_base_id FK
        int arrival_base_id FK
        decimal planned_distance
        time start_time
        time end_time
        varchar status
        text notes
        timestamp created_at
        timestamp updated_at
    }

    %% 運用実績
    operation_records {
        int id PK
        int vehicle_id FK
        date record_date
        varchar shift_type
        int departure_base_id FK
        int arrival_base_id FK
        decimal actual_distance
        time actual_start_time
        time actual_end_time
        varchar status
        text notes
        boolean auto_imported
        timestamp created_at
        timestamp updated_at
    }

    %% 検査計画
    inspection_plans {
        int id PK
        int vehicle_id FK
        varchar inspection_type
        varchar inspection_category
        date planned_start_date
        date planned_end_date
        varchar status
        text notes
        timestamp created_at
        timestamp updated_at
    }

    %% 検査実績
    inspections {
        int id PK
        int vehicle_id FK
        varchar inspection_type
        varchar inspection_category
        date inspection_date
        varchar inspector_name
        varchar status
        text findings
        timestamp created_at
        timestamp updated_at
    }

    %% 故障記録
    failures {
        int id PK
        int vehicle_id FK
        date failure_date
        varchar failure_type
        text description
        varchar severity
        varchar status
        timestamp created_at
        timestamp updated_at
    }

    %% 修理記録
    repairs {
        int id PK
        int failure_id FK
        int vehicle_id FK
        date repair_date
        varchar repair_type
        text description
        decimal cost
        varchar status
        timestamp created_at
        timestamp updated_at
    }

    %% 保守サイクル
    maintenance_cycles {
        int id PK
        varchar vehicle_type
        varchar inspection_type
        int cycle_days
        text description
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    %% 月次保守計画
    monthly_maintenance_plans {
        int id PK
        int vehicle_id FK
        date plan_month
        varchar inspection_type
        date planned_date
        varchar status
        text notes
        timestamp created_at
        timestamp updated_at
    }

    %% 走行計画
    travel_plans {
        int id PK
        int vehicle_id FK
        date plan_date
        varchar shift_type
        int departure_base_id FK
        int arrival_base_id FK
        decimal planned_distance
        time start_time
        time end_time
        varchar status
        text notes
        timestamp created_at
        timestamp updated_at
    }

    %% 走行実績
    travel_records {
        int id PK
        int vehicle_id FK
        date record_date
        varchar shift_type
        int departure_base_id FK
        int arrival_base_id FK
        decimal actual_distance
        time actual_start_time
        time actual_end_time
        varchar status
        text notes
        timestamp created_at
        timestamp updated_at
    }

    %% データベース管理テーブル
    database_backups {
        int id PK
        varchar filename
        text file_path
        decimal file_size
        varchar status
        timestamp created_at
        timestamp completed_at
        text error_message
        varchar created_by
    }

    database_restores {
        int id PK
        varchar backup_filename
        timestamp restored_at
        varchar status
        text error_message
        varchar restored_by
    }

    database_connections {
        int id PK
        timestamp connection_time
        varchar status
        int response_time_ms
        text error_message
        varchar client_ip
        text user_agent
    }

    database_performance {
        int id PK
        timestamp recorded_at
        decimal cpu_usage_percent
        decimal memory_usage_percent
        decimal disk_usage_percent
        int active_connections
        decimal database_size_mb
        int slow_queries_count
        int total_queries_count
    }

    %% リレーションシップ
    management_offices ||--o{ maintenance_bases : "管理"
    management_offices ||--o{ bases : "管理"
    management_offices ||--o{ vehicles : "管理"
    maintenance_bases ||--o{ vehicles : "所属"
    bases ||--o{ vehicles : "所属"
    vehicle_types ||--o{ vehicles : "分類"
    vehicle_types ||--o{ maintenance_cycles : "定義"
    inspection_types ||--o{ maintenance_cycles : "定義"
    inspection_types ||--o{ inspection_plans : "指定"
    inspection_types ||--o{ inspections : "指定"
    inspection_types ||--o{ monthly_maintenance_plans : "指定"
    
    vehicles ||--o{ operation_plans : "計画"
    vehicles ||--o{ operation_records : "実績"
    vehicles ||--o{ inspection_plans : "計画"
    vehicles ||--o{ inspections : "実績"
    vehicles ||--o{ failures : "故障"
    vehicles ||--o{ repairs : "修理"
    vehicles ||--o{ monthly_maintenance_plans : "計画"
    vehicles ||--o{ travel_plans : "計画"
    vehicles ||--o{ travel_records : "実績"
    
    bases ||--o{ operation_plans : "出発地"
    bases ||--o{ operation_plans : "到着地"
    bases ||--o{ operation_records : "出発地"
    bases ||--o{ operation_records : "到着地"
    bases ||--o{ travel_plans : "出発地"
    bases ||--o{ travel_plans : "到着地"
    bases ||--o{ travel_records : "出発地"
    bases ||--o{ travel_records : "到着地"
    
    failures ||--o{ repairs : "修理"
```

## 主要テーブル説明

### 1. 管理事業所 (management_offices)
- 鉄道事業所の管理情報
- 担当駅の管理（station_1〜station_6）

### 2. 保守基地 (maintenance_bases)
- 車両の保守を行う基地の情報
- 管理事業所に所属

### 3. 車両 (vehicles)
- 鉄道車両の基本情報
- 管理事業所と保守基地に所属
- 車種による分類

### 4. 運用管理
- **運用計画 (operation_plans)**: 車両の運用予定
- **運用実績 (operation_records)**: 実際の運用記録
- **走行計画 (travel_plans)**: 走行予定
- **走行実績 (travel_records)**: 実際の走行記録

### 5. 保守管理
- **検査計画 (inspection_plans)**: 検査予定
- **検査実績 (inspections)**: 実際の検査記録
- **保守サイクル (maintenance_cycles)**: 車種別の検査周期
- **月次保守計画 (monthly_maintenance_plans)**: 月別の保守計画

### 6. 故障管理
- **故障記録 (failures)**: 車両の故障情報
- **修理記録 (repairs)**: 故障に対する修理記録

### 7. マスタデータ
- **車種 (vehicle_types)**: 車両の種類
- **検査種別 (inspection_types)**: 検査の種類

### 8. データベース管理
- **バックアップ履歴 (database_backups)**: データベースバックアップ記録
- **復元履歴 (database_restores)**: データベース復元記録
- **接続ログ (database_connections)**: データベース接続記録
- **パフォーマンスログ (database_performance)**: システムパフォーマンス記録

## 主要なビジネスルール

1. **車両管理**: 各車両は管理事業所と保守基地に所属
2. **運用管理**: 計画と実績の対比で運用効率を管理
3. **保守管理**: 車種別の保守サイクルに基づく定期検査
4. **故障管理**: 故障から修理までの一連の流れを記録
5. **データ管理**: システムの健全性を監視・記録 