import express from 'express';
import db from '../db.js';

const router = express.Router();

// 運用計画の一覧取得
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    
    let query = 'SELECT * FROM operations.operation_plans';
    const params = [];
    
    if (month) {
      query += ' WHERE TO_CHAR(operation_date, \'YYYY-MM\') = $1';
      params.push(month);
    }
    
    query += ' ORDER BY operation_date, vehicle_id';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching operation plans:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 運用計画の作成
router.post('/', async (req, res) => {
  try {
    const { vehicle_id, operation_date, base_id, route_pattern, duty_number } = req.body;
    
    const query = `
      INSERT INTO operations.operation_plans 
        (vehicle_id, operation_date, base_id, route_pattern, duty_number)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await db.query(query, [vehicle_id, operation_date, base_id, route_pattern, duty_number]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating operation plan:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 運用計画の更新
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicle_id, operation_date, base_id, route_pattern, duty_number } = req.body;
    
    const query = `
      UPDATE operations.operation_plans 
      SET vehicle_id = $1, operation_date = $2, base_id = $3, 
          route_pattern = $4, duty_number = $5, updated_at = CURRENT_TIMESTAMP
      WHERE plan_id = $6
      RETURNING *
    `;
    
    const result = await db.query(query, [vehicle_id, operation_date, base_id, route_pattern, duty_number, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Operation plan not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating operation plan:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 運用計画の削除
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM operations.operation_plans WHERE plan_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Operation plan not found' });
    }
    
    res.json({ message: 'Operation plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting operation plan:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;
