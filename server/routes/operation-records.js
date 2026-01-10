import express from 'express';
import db from '../db.js';
import { getTablePath } from '../lib/db-routing.js';

const router = express.Router();

// GET /api/operation-records - 運用実績の一覧取得（月フィルタ対応）
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    const tablePath = await getTablePath('operation_records');
    
    let query = `
      SELECT 
        record_id, 
        schedule_id,
        vehicle_id, 
        operation_date, 
        start_time, 
        end_time, 
        status, 
        notes, 
        created_at, 
        updated_at
      FROM ${tablePath}
    `;
    
    const params = [];
    
    if (month) {
      query += ` WHERE operation_date >= $1 AND operation_date < ($1::date + interval '1 month')`;
      params.push(`${month}-01`);
    }
    
    query += ` ORDER BY operation_date, start_time`;
    
    const result = await db.query(query, params);
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
    const tablePath = await getTablePath('operation_records');
    
    const result = await db.query(
      `SELECT * FROM ${tablePath} WHERE record_id = $1`,
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
      schedule_id,
      vehicle_id,
      operation_date,
      start_time,
      end_time,
      status,
      notes,
    } = req.body;
    const tablePath = await getTablePath('operation_records');

    const result = await db.query(
      `INSERT INTO ${tablePath} (
        schedule_id,
        vehicle_id, 
        operation_date, 
        start_time, 
        end_time, 
        status, 
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        schedule_id,
        vehicle_id,
        operation_date,
        start_time,
        end_time,
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
      schedule_id,
      vehicle_id,
      operation_date,
      start_time,
      end_time,
      status,
      notes,
    } = req.body;
    const tablePath = await getTablePath('operation_records');

    const result = await db.query(
      `UPDATE ${tablePath} 
      SET 
        schedule_id = $1,
        vehicle_id = $2,
        operation_date = $3,
        start_time = $4,
        end_time = $5,
        status = $6,
        notes = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE record_id = $8
      RETURNING *`,
      [
        schedule_id,
        vehicle_id,
        operation_date,
        start_time,
        end_time,
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
    const tablePath = await getTablePath('operation_records');
    
    const result = await db.query(
        `DELETE FROM ${tablePath} WHERE record_id = $1 RETURNING record_id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '運用実績が見つかりません' });
    }

    res.json({ message: '運用実績を削除しました', id: result.rows[0].record_id });
  } catch (error) {
    console.error('運用実績削除エラー:', error);
    res.status(500).json({ 
      error: '運用実績の削除に失敗しました',
      details: error.message 
    });
  }
});

export default router;
