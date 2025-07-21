-- 事業所マスタテーブル
CREATE TABLE IF NOT EXISTS offices (
  id SERIAL PRIMARY KEY,
  office_name VARCHAR(100) NOT NULL UNIQUE,
  region VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- basesテーブルに事業所IDを追加
ALTER TABLE bases 
ADD COLUMN IF NOT EXISTS office_id INTEGER REFERENCES offices(id) ON DELETE SET NULL;

-- 事業所マスタデータ
INSERT INTO offices (office_name, region) VALUES
('東京事業所', '関東'),
('大阪事業所', '関西'),
('名古屋事業所', '中部'),
('福岡事業所', '九州'),
('仙台事業所', '東北'),
('札幌事業所', '北海道');

-- 既存の基地に事業所を割り当て
UPDATE bases SET office_id = 1 WHERE base_name LIKE '%東京%';
UPDATE bases SET office_id = 2 WHERE base_name LIKE '%大阪%';
UPDATE bases SET office_id = 3 WHERE base_name LIKE '%名古屋%';
UPDATE bases SET office_id = 4 WHERE base_name LIKE '%福岡%';
UPDATE bases SET office_id = 5 WHERE base_name LIKE '%仙台%';
UPDATE bases SET office_id = 6 WHERE base_name LIKE '%札幌%';

-- 追加の基地データ（400列に近づけるため）
INSERT INTO bases (base_name, location, office_id) VALUES
-- 東京事業所管轄
('品川基地', '東京都品川区', 1),
('新宿基地', '東京都新宿区', 1),
('池袋基地', '東京都豊島区', 1),
('上野基地', '東京都台東区', 1),
('渋谷基地', '東京都渋谷区', 1),
('秋葉原基地', '東京都千代田区', 1),
('有楽町基地', '東京都千代田区', 1),
('浜松町基地', '東京都港区', 1),
('田町基地', '東京都港区', 1),
('五反田基地', '東京都品川区', 1),
-- 大阪事業所管轄
('梅田基地', '大阪府大阪市北区', 2),
('難波基地', '大阪府大阪市中央区', 2),
('天王寺基地', '大阪府大阪市天王寺区', 2),
('新大阪基地', '大阪府大阪市淀川区', 2),
('京橋基地', '大阪府大阪市都島区', 2),
('鶴橋基地', '大阪府大阪市生野区', 2),
('西九条基地', '大阪府大阪市此花区', 2),
('弁天町基地', '大阪府大阪市港区', 2),
('森ノ宮基地', '大阪府大阪市中央区', 2),
('寺田町基地', '大阪府大阪市阿倍野区', 2),
-- 名古屋事業所管轄
('栄基地', '愛知県名古屋市中区', 3),
('金山基地', '愛知県名古屋市中区', 3),
('千種基地', '愛知県名古屋市千種区', 3),
('今池基地', '愛知県名古屋市千種区', 3),
('藤が丘基地', '愛知県名古屋市名東区', 3),
('本山基地', '愛知県名古屋市千種区', 3),
('覚王山基地', '愛知県名古屋市千種区', 3),
('東山公園基地', '愛知県名古屋市千種区', 3),
('星ヶ丘基地', '愛知県名古屋市千種区', 3),
('一社基地', '愛知県名古屋市名東区', 3);

-- さらに多くの基地を追加（サンプル）
DO $$
DECLARE
    i INTEGER;
    office_id_val INTEGER;
    base_name_val VARCHAR(100);
BEGIN
    FOR i IN 1..350 LOOP
        office_id_val := (i % 6) + 1;
        base_name_val := '基地' || LPAD(i::text, 3, '0');
        
        INSERT INTO bases (base_name, location, office_id) 
        VALUES (base_name_val, '所在地' || i, office_id_val);
    END LOOP;
END $$;
