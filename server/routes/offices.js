import express from 'express';
import db from '../db.js';

const router = express.Router();

// 事業所一覧の取得
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        office_id,
        office_name,
        office_code,
        responsible_area,
        created_at,
        updated_at
      FROM master_data.management_offices
      ORDER BY office_code
    `;
    
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching offices:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 事業所の詳細取得
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        office_id,
        office_name,
        office_code,
        responsible_area,
        created_at,
        updated_at
      FROM master_data.management_offices
      WHERE office_id = $1
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Office not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching office:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 事業所の作成
router.post('/', async (req, res) => {
  try {
    const { office_name, office_code, responsible_area } = req.body;
    
    const query = `
      INSERT INTO master_data.management_offices 
        (office_name, office_code, responsible_area)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await db.query(query, [office_name, office_code, responsible_area]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating office:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 事業所の更新
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { office_name, office_code, responsible_area } = req.body;
    
    const query = `
      UPDATE master_data.management_offices 
      SET office_name = $1, 
          office_code = $2, 
          responsible_area = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE office_id = $4
      RETURNING *
    `;
    
    const result = await db.query(query, [office_name, office_code, responsible_area, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Office not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating office:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 事業所の削除
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM master_data.management_offices WHERE office_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Office not found' });
    }
    
    res.json({ message: 'Office deleted successfully' });
  } catch (error) {
    console.error('Error deleting office:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;
