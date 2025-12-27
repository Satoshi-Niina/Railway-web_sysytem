-- 検修タイプマスタに素早くサンプルデータを挿入
-- DBeaver, pgAdmin, またはpsqlで実行してください

-- 既存のデータを確認
SELECT COUNT(*) as 現在のレコード数 FROM master_data.inspection_types;

-- サンプルデータを挿入（重複がある場合はスキップ）
INSERT INTO master_data.inspection_types (type_name, category, interval_days, description) 
VALUES
('日検査', '定期検査', 1, '日次の定期検査'),
('週検査', '定期検査', 7, '週次の定期検査'),
('月検査', '定期検査', 30, '月次の定期検査'),
('3ヶ月検査', '定期検査', 90, '3ヶ月ごとの定期検査'),
('6ヶ月検査', '定期検査', 180, '6ヶ月ごとの定期検査'),
('年次検査', '定期検査', 365, '年次の定期検査'),
('重要部検査A', '重要部検査', 730, '2年ごとの重要部検査A'),
('重要部検査B', '重要部検査', 1095, '3年ごとの重要部検査B'),
('全般検査', '全般検査', 1460, '4年ごとの全般検査'),
('臨時検査', '臨時検査', 1, '故障や異常時の臨時検査'),
('事故後検査', '臨時検査', 1, '事故発生後の検査'),
('改造工事', '改造', 30, '車両の改造工事'),
('大規模修繕', '修繕', 14, '大規模な修繕作業'),
('塗装工事', '修繕', 7, '車両の塗装工事'),
('小修繕', '修繕', 3, '軽微な修繕作業')
ON CONFLICT DO NOTHING;

-- 挿入結果を確認（検修種別・日数の形式で表示）
SELECT 
    id,
    type_name || '・' || interval_days || '日' as 表示名,
    category as カテゴリ,
    interval_days as 日数,
    description as 説明
FROM master_data.inspection_types 
ORDER BY category, interval_days;
