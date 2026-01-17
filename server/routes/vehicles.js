import express from 'express';
import db from '../db.js';

const router = express.Router();

// 車両一覧の取得
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        v.vehicle_id as id,
        v.vehicle_id,
        v.registration_number as machine_number,
        v.registration_number as vehicle_number,
        v.status,
        v.notes,
        v.office_id as management_office_id,
        mo.office_name,
        b.base_name,
        mt.type_code as vehicle_type,
        mt.type_name as machine_type_name,
        mt.model_name as model_name,
        mt.category,
        m.machine_number as master_machine_number,
        m.id as machine_id
      FROM master_data.vehicles v
      LEFT JOIN master_data.machines m ON v.machine_id = m.id
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
      LEFT JOIN master_data.management_offices mo ON v.office_id = mo.office_id
      LEFT JOIN master_data.bases b ON m.assigned_base_id = b.base_id
      ORDER BY v.registration_number
    `;
    
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 車両の詳細取得
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        v.*,
        v.registration_number as vehicle_number,
        mo.office_name,
        b.base_name,
        mt.type_name,
        mt.model_name
      FROM master_data.vehicles v
      LEFT JOIN master_data.machines m ON v.machine_id = m.id
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
      LEFT JOIN master_data.management_offices mo ON v.office_id = mo.office_id
      LEFT JOIN master_data.bases b ON m.assigned_base_id = b.base_id
      WHERE v.vehicle_id = $1
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 車両の作成
router.post('/', async (req, res) => {
  try {
    const { 
      registration_number, 
      machine_id, 
      office_id, 
      status,
      notes
    } = req.body;
    
    const query = `
      INSERT INTO master_data.vehicles 
        (registration_number, machine_id, office_id, status, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      registration_number, 
      machine_id, 
      office_id, 
      status || '運用中',
      notes
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 車両の更新
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      registration_number, 
      machine_id, 
      office_id, 
      status,
      notes
    } = req.body;
    
    const query = `
      UPDATE master_data.vehicles 
      SET registration_number = $1, 
          machine_id = $2, 
          office_id = $3, 
          status = $4,
          notes = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE vehicle_id = $6
      RETURNING *
    `;
    
    const result = await db.query(query, [
      registration_number, 
      machine_id, 
      office_id, 
      status,
      notes,
      id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 車両の削除
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM master_data.vehicles WHERE vehicle_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;
