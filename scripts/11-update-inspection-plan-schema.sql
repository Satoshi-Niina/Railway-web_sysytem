-- inspection_plans テーブルの inspection_category CHECK 制約に 'その他' を追加
ALTER TABLE inspection_plans DROP CONSTRAINT IF EXISTS inspection_plans_inspection_category_check;
ALTER TABLE inspection_plans ADD CONSTRAINT inspection_plans_inspection_category_check CHECK (inspection_category IN ('臨修', '定検', '乙検', '甲検', 'その他'));

-- 既存の inspection_plans データに新しい検査種別を割り当てる（サンプル用）
-- 注意: 実際の運用では、既存データに合わせて適切な検査種別を設定してください
UPDATE inspection_plans
SET
  inspection_type = CASE inspection_category
    WHEN '臨修' THEN '臨時修繕'
    WHEN '定検' THEN '定期点検'
    WHEN '乙検' THEN '乙A検査' -- または乙B検査
    WHEN '甲検' THEN '甲A検査' -- または甲B検査
    ELSE 'その他'
  END;
