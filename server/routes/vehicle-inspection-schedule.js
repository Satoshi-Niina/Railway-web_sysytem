import express from 'express';
import db from '../db.js';

const router = express.Router();

// 車両検査スケジュールの取得（警告・予告付き）
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonthStr = month || new Date().toISOString().slice(0, 7); // YYYY-MM
    const targetDate = new Date(targetMonthStr + '-01');
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1;

    // 1. 車両データと機種マスタ、および検査スケジュールマスタを取得
    // 起算日として purchase_date を使用し、なければ created_at を使用
    const query = `
      WITH machine_data AS (
        SELECT 
          m.id as vehicle_id,
          m.machine_number,
          m.machine_type_id,
          mt.model_name as vehicle_type,
          COALESCE(m.last_inspection_date, m.purchase_date, m.created_at)::date as base_date
        FROM master_data.machines m
        LEFT JOIN master_data.machine_types mt ON m.machine_type_id = mt.type_code
      ),
      schedule_rules AS (
        SELECT 
          s.machine_id as rule_machine_id, -- 機種コードまたは個別ID
          s.inspection_type_id,
          s.cycle_months,
          s.duration_days,
          it.type_name
        FROM master_data.inspection_schedules s
        JOIN master_data.inspection_types it ON s.inspection_type_id = it.id
        WHERE s.is_active = true
      )
      SELECT 
        md.*,
        sr.type_name,
        sr.cycle_months,
        sr.duration_days
      FROM machine_data md
      JOIN schedule_rules sr ON (md.machine_type_id = sr.rule_machine_id OR md.vehicle_id::text = sr.rule_machine_id)
    `;
    
    const result = await db.query(query);
    const allPossibleSchedules = result.rows;

    const scheduledInspections = [];

    for (const item of allPossibleSchedules) {
      if (!item.base_date || !item.cycle_months) continue;

      const baseDate = new Date(item.base_date);
      const baseYear = baseDate.getFullYear();
      const baseMonth = baseDate.getMonth() + 1;

      // ヶ月単位での差分を計算
      const diffMonths = (targetYear - baseYear) * 12 + (targetMonth - baseMonth);

      // 周期に一致するかチェック (diffMonthsが正であり、周期の倍数である場合)
      if (diffMonths >= 0 && diffMonths % item.cycle_months === 0) {
        scheduledInspections.push({
          vehicle_id: item.vehicle_id,
          machine_number: item.machine_number,
          vehicle_type: item.vehicle_type,
          state: 'planned',
          inspection_type: item.type_name,
          cycle_months: item.cycle_months,
          duration_days: item.duration_days,
          planned_start_date: `${targetMonthStr}-01`, // 月の初日を仮定
          is_warning: true,
          is_in_period: true
        });
      }
    }
    
    res.json(scheduledInspections);
  } catch (error) {
    console.error('Error fetching vehicle inspection schedule:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;
