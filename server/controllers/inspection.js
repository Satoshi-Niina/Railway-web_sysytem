import pool from '../db.js';

export const getInspections = async (req, res) => {
  try {
    const { month } = req.query;
    
    let query = `
      SELECT 
        ip.id,
        ip.vehicle_id,
        ip.inspection_type,
        ip.inspection_category,
        ip.planned_start_date as inspection_date,
        ip.planned_end_date,
        ip.status,
        ip.notes,
        ip.created_at,
        ip.updated_at,
        mt.type_code as vehicle_type,
        v.registration_number as machine_number,
        v.office_id as management_office_id
      FROM inspections.inspection_plans ip
      LEFT JOIN master_data.vehicles v ON ip.vehicle_id = v.vehicle_id
      LEFT JOIN master_data.machines m ON v.machine_id = m.id
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
    `;
    
    const queryParams = [];
    
    // 月フィルター
    if (month) {
      query += ` WHERE DATE_TRUNC('month', ip.planned_start_date) = DATE_TRUNC('month', $1::date)`;
      queryParams.push(`${month}-01`);
    }
    
    query += ` ORDER BY ip.planned_start_date ASC`;
    
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error('検査データ取得エラー:', err);
    res.status(500).json({ error: '検査データの取得に失敗しました', details: err.message });
  }
};

export const createInspection = async (req, res) => {
  const { vehicle_id, inspection_type, inspection_category, planned_start_date, planned_end_date, status, notes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO inspections.inspection_plans 
       (vehicle_id, inspection_type, inspection_category, planned_start_date, planned_end_date, status, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [vehicle_id, inspection_type, inspection_category, planned_start_date, planned_end_date, status || 'planned', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('検査計画作成エラー:', err);
    res.status(500).json({ error: '検査計画の作成に失敗しました', details: err.message });
  }
};
