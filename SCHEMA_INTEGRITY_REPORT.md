# CloudDB スキーマ整合性チェック結果

実行日時: 2026年1月9日

## 概要

CloudDBの実際の構造と期待されるスキーマ設計を比較したところ、以下の不整合が見つかりました。

---

## ✅ 正常なスキーマ

### 1. **public** (基盤・共通)
- **ステータス**: ✓ OK
- **期待テーブル数**: 4
- **実際テーブル数**: 17
- **評価**: 期待されるテーブルはすべて存在
- **注意点**: 追加のテーブルが13個存在（他のスキーマから移動すべきテーブルが含まれる）

### 2. **master_data** (共有マスタ)
- **ステータス**: ✓ OK
- **期待テーブル数**: 7
- **実際テーブル数**: 15
- **評価**: 期待されるテーブルはすべて存在
- **追加テーブル**: app_config, app_config_history, chats, fault_history_images, machine_types, managements_offices, vehicle_types, vehicles

### 3. **inspections** (保守用車管理)
- **ステータス**: ✓ OK
- **期待テーブル数**: 1
- **実際テーブル数**: 1
- **評価**: 完全一致

---

## ⚠️ 問題のあるスキーマ

### 4. **operations** (運用管理)
- **ステータス**: ⚠️ テーブル不足
- **期待テーブル数**: 5
- **実際テーブル数**: 3
- **不足しているテーブル**:
  - `support_flows` → **public スキーマに存在**
  - `support_history` → **public スキーマに存在**
  
**問題**: サポート関連のテーブルが public スキーマに残っている

### 5. **emergency** (応急復旧支援)
- **ステータス**: ⚠️ テーブル不足（重大）
- **期待テーブル数**: 8
- **実際テーブル数**: 1
- **不足しているテーブル**:
  - `emergency_flows` → **public スキーマに存在**
  - `messages` → **public スキーマに存在**
  - `media` → **public スキーマに存在**
  - `images` → **public スキーマに存在**
  - `image_data` → **public スキーマに存在**
  - `chat_exports` → **public スキーマに存在**
  - `chat_history_backup` → **public スキーマに存在**

**問題**: emergency 機能の7つのテーブルがすべて public スキーマに残っている

### 6. **maintenance** (機械故障管理)
- **ステータス**: ⚠️ テーブル不足
- **期待テーブル数**: 2
- **実際テーブル数**: 1
- **不足しているテーブル**:
  - `fault_history` → **public スキーマに存在**

**問題**: 故障履歴テーブルが public スキーマに残っている

---

## 🔍 その他の発見

### 予期しないスキーマ
- **google_vacuum_mgmt**: 空のスキーマ（テーブルなし）

### public スキーマに存在する移動すべきテーブル

現在 public スキーマには以下の「本来は専用スキーマに属すべき」テーブルが残っています:

```
operations スキーマへ移動すべき:
├── support_flows
└── support_history

emergency スキーマへ移動すべき:
├── emergency_flows
├── messages
├── media
├── images
├── image_data
├── chat_exports
└── chat_history_backup

maintenance スキーマへ移動すべき:
└── fault_history

その他（分類要確認）:
├── chat_history → master_data に既に存在、重複の可能性
├── documents → 目的不明
└── history_images → 用途確認が必要
```

---

## 📋 推奨アクション

### 優先度: 高

1. **emergency スキーマの整備**
   - public から emergency スキーマへ7つのテーブルを移動
   - emergency_flows, messages, media, images, image_data, chat_exports, chat_history_backup

2. **operations スキーマの整備**
   - public から operations スキーマへ2つのテーブルを移動
   - support_flows, support_history

3. **maintenance スキーマの整備**
   - public から maintenance スキーマへ1つのテーブルを移動
   - fault_history

### 優先度: 中

4. **重複テーブルの調査**
   - public.chat_history と master_data.chat_history の関係を確認
   - どちらか一方を削除または統合

5. **未分類テーブルの整理**
   - public.documents の用途を確認し、適切なスキーマへ移動
   - public.history_images の用途を確認

6. **google_vacuum_mgmt スキーマの処理**
   - 使用されていない場合は削除を検討

---

## 🛠️ 修正スクリプト案

テーブル移動用のSQLスクリプトを作成することを推奨します:

```sql
-- operations スキーマへの移動
ALTER TABLE public.support_flows SET SCHEMA operations;
ALTER TABLE public.support_history SET SCHEMA operations;

-- emergency スキーマへの移動
ALTER TABLE public.emergency_flows SET SCHEMA emergency;
ALTER TABLE public.messages SET SCHEMA emergency;
ALTER TABLE public.media SET SCHEMA emergency;
ALTER TABLE public.images SET SCHEMA emergency;
ALTER TABLE public.image_data SET SCHEMA emergency;
ALTER TABLE public.chat_exports SET SCHEMA emergency;
ALTER TABLE public.chat_history_backup SET SCHEMA emergency;

-- maintenance スキーマへの移動
ALTER TABLE public.fault_history SET SCHEMA maintenance;
```

**注意**: 移動前に外部キー制約やビュー、関数などの依存関係を確認してください。

---

## 結論

CloudDBのスキーマ構造は部分的にしか整理されておらず、多くの業務機能テーブルが public スキーマに残ったままです。特に emergency スキーマは emergency_records 以外のすべてのテーブルが public に残っており、スキーマ分離の目的が達成されていません。

計画通りのスキーマ構造を実現するには、上記の修正を実施する必要があります。
