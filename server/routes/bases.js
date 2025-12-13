import express from 'express';
import db from '../db.js';

const router = express.Router();

// 基地一覧の取得
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        b.*,
        mo.office_name,
        mo.office_code
      FROM master_data.bases b
      LEFT JOIN master_data.management_offices mo ON b.office_id = mo.office_id
      ORDER BY b.base_code
    `;
    
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bases:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 基地の詳細取得
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        b.*,
        mo.office_name,
        mo.office_code
      FROM master_data.bases b
      LEFT JOIN master_data.management_offices mo ON b.office_id = mo.office_id
      WHERE b.base_id = $1
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Base not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching base:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 基地の作成
router.post('/', async (req, res) => {
  try {
    const { base_name, base_code, location, office_id, storage_capacity } = req.body;
    
    const query = `
      INSERT INTO master_data.bases 
        (base_name, base_code, location, office_id, storage_capacity)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await db.query(query, [base_name, base_code, location, office_id, storage_capacity]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating base:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 基地の更新
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { base_name, base_code, location, office_id, storage_capacity } = req.body;
    
    const query = `
      UPDATE master_data.bases 
      SET base_name = $1, 
          base_code = $2, 
          location = $3, 
          office_id = $4, 
          storage_capacity = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE base_id = $6
      RETURNING *
    `;
    
    const result = await db.query(query, [base_name, base_code, location, office_id, storage_capacity, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Base not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating base:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 基地の削除
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM master_data.bases WHERE base_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Base not found' });
    }
    
    res.json({ message: 'Base deleted successfully' });
  } catch (error) {
    console.error('Error deleting base:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;
