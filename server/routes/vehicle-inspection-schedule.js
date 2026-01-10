import express from 'express';
import db from '../db.js';

const router = express.Router();

// 車両検査スケジュールの取得（警告付き）
router.get('/', async (req, res) => {
  try {
    const { month, show_warnings } = req.query;
    
    // このエンドポイントは将来的に実装予定
    // 現在は空の配列を返す（エラーを回避）
    if (show_warnings === 'true') {
      // 検査予告機能は将来実装
      res.json([]);
      return;
    }
    
    let query = `
      SELECT 
        v.id as vehicle_id,
        v.vehicle_type,
        v.machine_number,
        ip.id as inspection_plan_id,
        ip.inspection_type,
        ip.inspection_category,
        ip.planned_start_date,
        ip.planned_end_date,
        ip.status,
        false as is_warning,
        false as is_in_period
      FROM master_data.vehicles v
      LEFT JOIN inspections.inspection_plans ip ON v.id = ip.vehicle_id
    `;
    
    const params = [];
    
    if (month) {
      query += ` WHERE DATE_TRUNC('month', ip.planned_start_date) = DATE_TRUNC('month', $1::date)`;
      params.push(`${month}-01`);
    }
    
    query += ` ORDER BY v.vehicle_type, v.machine_number, ip.planned_start_date`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching vehicle inspection schedule:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;
