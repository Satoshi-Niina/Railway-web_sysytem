import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;

const router = express.Router();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number.parseInt(process.env.DB_PORT || "5432"),
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// GET /api/operation-records - 運用実績の一覧取得（月フィルタ対応）
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    
    let query = `
      SELECT 
        id, 
        vehicle_id, 
        record_date, 
        shift_type, 
        start_time, 
        end_time, 
        actual_distance, 
        departure_base_id, 
        arrival_base_id, 
        status, 
        notes, 
        created_at, 
        updated_at
      FROM operations.operation_records
    `;
    
    const params = [];
    
    if (month) {
      query += ` WHERE record_date >= $1 AND record_date < ($1::date + interval '1 month')`;
      params.push(`${month}-01`);
    }
    
    query += ` ORDER BY record_date, start_time`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('運用実績取得エラー:', error);
    res.status(500).json({ 
      error: '運用実績の取得に失敗しました',
      details: error.message 
    });
  }
});

// GET /api/operation-records/:id - 特定の運用実績を取得
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT 
        id, 
        vehicle_id, 
        record_date, 
        shift_type, 
        start_time, 
        end_time, 
        actual_distance, 
        departure_base_id, 
        arrival_base_id, 
        status, 
        notes, 
        created_at, 
        updated_at
      FROM operations.operation_records 
      WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '運用実績が見つかりません' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('運用実績取得エラー:', error);
    res.status(500).json({ 
      error: '運用実績の取得に失敗しました',
      details: error.message 
    });
  }
});

// POST /api/operation-records - 新しい運用実績を作成
router.post('/', async (req, res) => {
  try {
    const {
      vehicle_id,
      record_date,
      shift_type,
      start_time,
      end_time,
      actual_distance,
      departure_base_id,
      arrival_base_id,
      status,
      notes,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO operations.operation_records (
        vehicle_id, 
        record_date, 
        shift_type, 
        start_time, 
        end_time, 
        actual_distance, 
        departure_base_id, 
        arrival_base_id, 
        status, 
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING 
        id, 
        vehicle_id, 
        record_date, 
        shift_type, 
        start_time, 
        end_time, 
        actual_distance, 
        departure_base_id, 
        arrival_base_id, 
        status, 
        notes, 
        created_at, 
        updated_at`,
      [
        vehicle_id,
        record_date,
        shift_type,
        start_time,
        end_time,
        actual_distance,
        departure_base_id,
        arrival_base_id,
        status,
        notes,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('運用実績作成エラー:', error);
    res.status(500).json({ 
      error: '運用実績の作成に失敗しました',
      details: error.message 
    });
  }
});

// PUT /api/operation-records/:id - 運用実績を更新
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vehicle_id,
      record_date,
      shift_type,
      start_time,
      end_time,
      actual_distance,
      departure_base_id,
      arrival_base_id,
      status,
      notes,
    } = req.body;

    const result = await pool.query(
      `UPDATE operations.operation_records 
      SET 
        vehicle_id = $1,
        record_date = $2,
        shift_type = $3,
        start_time = $4,
        end_time = $5,
        actual_distance = $6,
        departure_base_id = $7,
        arrival_base_id = $8,
        status = $9,
        notes = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING 
        id, 
        vehicle_id, 
        record_date, 
        shift_type, 
        start_time, 
        end_time, 
        actual_distance, 
        departure_base_id, 
        arrival_base_id, 
        status, 
        notes, 
        created_at, 
        updated_at`,
      [
        vehicle_id,
        record_date,
        shift_type,
        start_time,
        end_time,
        actual_distance,
        departure_base_id,
        arrival_base_id,
        status,
        notes,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '運用実績が見つかりません' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('運用実績更新エラー:', error);
    res.status(500).json({ 
      error: '運用実績の更新に失敗しました',
      details: error.message 
    });
  }
});

// DELETE /api/operation-records/:id - 運用実績を削除
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
        'DELETE FROM operations.operation_records WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '運用実績が見つかりません' });
    }

    res.json({ message: '運用実績を削除しました', id: result.rows[0].id });
  } catch (error) {
    console.error('運用実績削除エラー:', error);
    res.status(500).json({ 
      error: '運用実績の削除に失敗しました',
      details: error.message 
    });
  }
});

export default router;
