import pool from '../db.js';

export const getInspections = async (req, res) => {
  try {
    const { month } = req.query;
    
    let query = `
      SELECT 
        ip.*,
        v.vehicle_type,
        v.machine_number,
        v.management_office_id,
        it.type_name as inspection_type
      FROM maintenance.inspection_plans ip
      LEFT JOIN master_data.vehicles v ON ip.vehicle_id = v.id
      LEFT JOIN maintenance.inspection_types it ON ip.inspection_type_id = it.id
    `;
    
    const queryParams = [];
    
    // 月フィルター
    if (month) {
      query += ` WHERE DATE_TRUNC('month', ip.plan_date) = DATE_TRUNC('month', $1::date)`;
      queryParams.push(`${month}-01`);
    }
    
    query += ` ORDER BY ip.plan_date ASC`;
    
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error('検査データ取得エラー:', err);
    res.status(500).json({ error: '検査データの取得に失敗しました', details: err.message });
  }
};

export const createInspection = async (req, res) => {
  const { machine_id, inspector, inspected_at, result } = req.body;
  try {
    await pool.query(
      'INSERT INTO inspections (machine_id, inspector, inspected_at, result) VALUES ($1, $2, $3, $4)',
      [machine_id, inspector, inspected_at, result]
    );
    res.status(201).json({ message: 'Inspection added' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add inspection' });
  }
};
