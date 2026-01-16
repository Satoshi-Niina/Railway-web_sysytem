import express from 'express';
import db from '../db.js';

const router = express.Router();

// 車両一覧の取得
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        v.*,
        vt.type_name,
        vt.max_speed,
        vt.passenger_capacity,
        mo.office_name,
        b.base_name,
        mt.type_code as vehicle_type,
        mt.type_name as machine_type_name,
        mt.category,
        m.machine_number,
        m.id as machine_id
      FROM master_data.vehicles v
      LEFT JOIN master_data.vehicle_types vt ON v.vehicle_type_id = vt.type_id
      LEFT JOIN master_data.machines m ON v.vehicle_number::text = m.machine_number OR v.vehicle_id::text = m.serial_number
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
      LEFT JOIN master_data.management_offices mo ON v.office_id = mo.office_id
      LEFT JOIN master_data.bases b ON v.base_id = b.base_id
      ORDER BY v.vehicle_number
    `;
    
    const result = await db.query(query);
    console.log('=== Vehicles Query Result (first 3) ===');
    result.rows.slice(0, 3).forEach((row, idx) => {
      console.log(`Row ${idx}:`, {
        vehicle_id: row.vehicle_id,
        vehicle_number: row.vehicle_number,
        vehicle_type: row.vehicle_type,
        machine_number: row.machine_number,
        machine_type_name: row.machine_type_name,
        category: row.category
      });
    });
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
        vt.type_name,
        vt.max_speed,
        vt.passenger_capacity,
        mo.office_name,
        b.base_name
      FROM master_data.vehicles v
      LEFT JOIN master_data.vehicle_types vt ON v.vehicle_type_id = vt.type_id
      LEFT JOIN master_data.management_offices mo ON v.office_id = mo.office_id
      LEFT JOIN master_data.bases b ON v.base_id = b.base_id
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
      vehicle_number, 
      vehicle_type_id, 
      office_id, 
      base_id, 
      introduction_date, 
      status 
    } = req.body;
    
    const query = `
      INSERT INTO master_data.vehicles 
        (vehicle_number, vehicle_type_id, office_id, base_id, introduction_date, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      vehicle_number, 
      vehicle_type_id, 
      office_id, 
      base_id, 
      introduction_date, 
      status || '運用中'
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
      vehicle_number, 
      vehicle_type_id, 
      office_id, 
      base_id, 
      introduction_date, 
      status 
    } = req.body;
    
    const query = `
      UPDATE master_data.vehicles 
      SET vehicle_number = $1, 
          vehicle_type_id = $2, 
          office_id = $3, 
          base_id = $4, 
          introduction_date = $5, 
          status = $6,
          updated_at = CURRENT_TIMESTAMP
      WHERE vehicle_id = $7
      RETURNING *
    `;
    
    const result = await db.query(query, [
      vehicle_number, 
      vehicle_type_id, 
      office_id, 
      base_id, 
      introduction_date, 
      status,
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
