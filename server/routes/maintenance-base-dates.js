import express from 'express';
import db from '../db.js';

const router = express.Router();

// 検修起算日の一覧取得
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        mbd.id,
        mbd.vehicle_id,
        mbd.inspection_type_id,
        mbd.base_date,
        mbd.source,
        mbd.notes,
        mbd.created_at,
        mbd.updated_at
      FROM master_data.maintenance_base_dates mbd
      ORDER BY mbd.vehicle_id, mbd.inspection_type_id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching maintenance base dates:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 検修起算日の作成
router.post('/', async (req, res) => {
  try {
    const { vehicle_id, inspection_type_id, base_date, source, notes } = req.body;
    
    if (!vehicle_id || !inspection_type_id || !base_date) {
      return res.status(400).json({ error: 'vehicle_id, inspection_type_id, base_date are required' });
    }
    
    const result = await db.query(`
      INSERT INTO master_data.maintenance_base_dates 
        (vehicle_id, inspection_type_id, base_date, source, notes)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (vehicle_id, inspection_type_id) 
      DO UPDATE SET base_date = $3, source = $4, notes = $5, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [vehicle_id, inspection_type_id, base_date, source || 'manual', notes || null]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating maintenance base date:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 検修起算日の一括更新
router.post('/bulk-update', async (req, res) => {
  try {
    const { base_dates } = req.body;
    
    if (!base_dates || !Array.isArray(base_dates)) {
      return res.status(400).json({ error: 'base_dates array is required' });
    }
    
    let updatedCount = 0;
    
    for (const item of base_dates) {
      const { vehicle_id, inspection_type_id, base_date, source, notes } = item;
      
      if (!vehicle_id || !inspection_type_id || !base_date) {
        continue;
      }
      
      await db.query(`
        INSERT INTO master_data.maintenance_base_dates 
          (vehicle_id, inspection_type_id, base_date, source, notes)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (vehicle_id, inspection_type_id) 
        DO UPDATE SET base_date = $3, source = $4, notes = $5, updated_at = CURRENT_TIMESTAMP
      `, [vehicle_id, inspection_type_id, base_date, source || 'manual', notes || null]);
      
      updatedCount++;
    }
    
    res.json({ updated: updatedCount });
  } catch (error) {
    console.error('Error bulk updating maintenance base dates:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 検修起算日の更新
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { base_date, source, notes } = req.body;
    
    const result = await db.query(`
      UPDATE master_data.maintenance_base_dates 
      SET base_date = $1, source = $2, notes = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [base_date, source, notes, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Maintenance base date not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating maintenance base date:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 検修起算日の削除
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM master_data.maintenance_base_dates WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Maintenance base date not found' });
    }
    
    res.json({ message: 'Maintenance base date deleted successfully' });
  } catch (error) {
    console.error('Error deleting maintenance base date:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;
