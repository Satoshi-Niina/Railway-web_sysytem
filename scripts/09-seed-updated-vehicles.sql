-- 既存の車両データに新しいカラムのサンプルデータを追加
UPDATE vehicles
SET
  machine_number = 'M001' || id,
  manufacturer = CASE id
    WHEN 1 THEN 'A社'
    WHEN 2 THEN 'B社'
    WHEN 3 THEN 'C社'
    WHEN 4 THEN 'A社'
    WHEN 5 THEN 'B社'
    ELSE '不明'
  END,
  acquisition_date = CASE id
    WHEN 1 THEN '2020-04-01'
    WHEN 2 THEN '2021-07-10'
    WHEN 3 THEN '2019-11-20'
    WHEN 4 THEN '2022-01-15'
    WHEN 5 THEN '2023-03-01'
    ELSE '2020-01-01'
  END,
  management_office = CASE id
    WHEN 1 THEN '東京事業所'
    WHEN 2 THEN '大阪事業所'
    WHEN 3 THEN '名古屋事業所'
    WHEN 4 THEN '東京事業所'
    WHEN 5 THEN '福岡事業所'
    ELSE '不明'
  END,
  type_approval_number = 'TA' || LPAD(id::text, 3, '0'),
  type_approval_expiration_date = CASE id
    WHEN 1 THEN '2025-03-31'
    WHEN 2 THEN '2026-06-30'
    WHEN 3 THEN '2024-10-31'
    WHEN 4 THEN '2027-12-31'
    WHEN 5 THEN '2028-02-28'
    ELSE '2025-01-01'
  END,
  type_approval_conditions = CASE id
    WHEN 1 THEN '高速走行時要点検'
    WHEN 2 THEN '積載量制限あり'
    WHEN 3 THEN '特定区間のみ走行可'
    WHEN 4 THEN '冬季運用制限あり'
    WHEN 5 THEN '定期的なソフトウェア更新必須'
    ELSE '特になし'
  END
WHERE machine_number IS NULL;

-- 新しいフィールドを含む追加のサンプル車両データ
INSERT INTO vehicles (name, model, category, base_location, machine_number, manufacturer, acquisition_date, management_office, type_approval_number, type_approval_expiration_date, type_approval_conditions) VALUES
('モータカー003', 'MC-200', 'モータカー', '仙台基地', 'M006', 'D社', '2023-05-20', '仙台事業所', 'TA006', '2028-04-30', '寒冷地仕様'),
('鉄トロ003', 'TT-300', '鉄トロ', '札幌基地', 'M007', 'E社', '2022-08-10', '札幌事業所', 'TA007', '2027-07-31', '積雪時運用可');
