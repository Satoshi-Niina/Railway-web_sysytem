import express from 'express';
import db from '../db.js';

const router = express.Router();

// 機械マスタ一覧取得
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        m.id,
        m.machine_number,
        m.machine_type_id,
        mt.type_name,
        mt.model_name,
        mt.category as machine_type,
        m.serial_number,
        m.office_id,
        o.office_name,
        m.notes as description,
        m.last_inspection_date,
        m.created_at,
        m.updated_at
      FROM master_data.machines m
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
      LEFT JOIN master_data.management_offices o ON m.office_id::integer = o.office_id
      ORDER BY m.machine_number
    `);
    
    console.log('=== Server Machines Query Result (first 2) ===');
    console.log(JSON.stringify(result.rows.slice(0, 2), null, 2));
    
    res.json(result.rows);
  } catch (error) {
    console.error('機械マスタ取得エラー:', error);
    res.status(500).json({ 
      error: '機械マスタの取得に失敗しました',
      details: error.message 
    });
  }
});

// 機械マスタ詳細取得
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT 
        m.id,
        m.machine_number,
        m.machine_type_id,
        mt.type_name,
        mt.model_name,
        mt.category as machine_type,
        m.serial_number,
        m.office_id,
        o.office_name,
        m.notes as description,
        m.last_inspection_date,
        m.created_at,
        m.updated_at
      FROM master_data.machines m
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
      LEFT JOIN master_data.management_offices o ON m.office_id::integer = o.office_id
      WHERE m.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '機械マスタが見つかりません' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('機械マスタ詳細取得エラー:', error);
    res.status(500).json({ 
      error: '機械マスタの取得に失敗しました',
      details: error.message 
    });
  }
});

// 検修完了日の更新
router.patch('/:id/inspection-completion', async (req, res) => {
  try {
    const { id } = req.params;
    const { completion_date } = req.body;
    
    if (!completion_date) {
      return res.status(400).json({ error: '完了日が指定されていません' });
    }

    const result = await db.query(`
      UPDATE master_data.machines 
      SET last_inspection_date = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [completion_date, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '機械が見つかりません' });
    }

    res.json({ success: true, machine: result.rows[0] });
  } catch (error) {
    console.error('検修完了日更新エラー:', error);
    res.status(500).json({ error: '更新に失敗しました' });
  }
});

export default router;
