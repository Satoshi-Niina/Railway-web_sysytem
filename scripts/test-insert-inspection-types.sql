-- 検修タイプマスタのテストデータを直接挿入（DBeaver等で実行）

-- 既存データの確認
SELECT * FROM master_data.inspection_types ORDER BY category, type_name;

-- 既存データを削除（必要に応じてコメント解除）
-- TRUNCATE TABLE master_data.inspection_types RESTART IDENTITY CASCADE;

-- データ挿入（interval_daysは検修期間の日数）
INSERT INTO master_data.inspection_types (type_name, category, interval_days, description) VALUES
-- 定期検査（短期間）
('日検査', '定期検査', 1, '日次の定期検査'),
('週検査', '定期検査', 7, '週次の定期検査'),
('月検査', '定期検査', 30, '月次の定期検査'),
('3ヶ月検査', '定期検査', 90, '3ヶ月ごとの定期検査'),
('6ヶ月検査', '定期検査', 180, '6ヶ月ごとの定期検査'),
('年次検査', '定期検査', 365, '年次の定期検査'),

-- 重要部検査（中期間）
('重要部検査A', '重要部検査', 730, '2年ごとの重要部検査A（730日）'),
('重要部検査B', '重要部検査', 1095, '3年ごとの重要部検査B（1095日）'),

-- 全般検査（長期間）
('全般検査', '全般検査', 1460, '4年ごとの全般検査（1460日）'),

-- 臨時検査（短期間）
('臨時検査', '臨時検査', 1, '故障や異常時の臨時検査'),
('事故後検査', '臨時検査', 1, '事故発生後の検査'),

-- 改造・修繕（期間は工事内容による）
('改造工事', '改造', 30, '車両の改造工事（約30日）'),
('大規模修繕', '修繕', 14, '大規模な修繕作業（約14日）'),
('塗装工事', '修繕', 7, '車両の塗装工事（約7日）'),
('小修繕', '修繕', 3, '軽微な修繕作業（約3日）');

-- 挿入結果の確認（検修種別・日数の形式で表示）
SELECT 
  id,
  type_name,
  category,
  CASE 
    WHEN interval_days IS NOT NULL THEN type_name || '・' || interval_days || '日'
    ELSE type_name || '・期間未設定'
  END as display_name,
  interval_days,
  description,
  created_at
FROM master_data.inspection_types 
ORDER BY category, interval_days NULLS LAST, type_name;
