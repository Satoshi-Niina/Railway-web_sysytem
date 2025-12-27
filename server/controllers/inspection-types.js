import pool from '../db.js';

// 検修タイプマスタ一覧取得
export const getInspectionTypes = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM master_data.inspection_types ORDER BY category, type_name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching inspection types:', err);
    res.status(500).json({ error: 'Failed to fetch inspection types' });
  }
};

// 検修タイプマスタ新規作成
export const createInspectionType = async (req, res) => {
  try {
    const { type_name, category, interval_days, description } = req.body;
    
    const result = await pool.query(
      `INSERT INTO master_data.inspection_types 
       (type_name, category, interval_days, description) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [type_name, category, interval_days, description]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating inspection type:', err);
    res.status(500).json({ error: 'Failed to create inspection type' });
  }
};
