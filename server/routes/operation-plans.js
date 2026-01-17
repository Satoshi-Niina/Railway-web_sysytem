import express from 'express';
import db from '../db.js';
import { getTablePath } from '../lib/db-routing.js';

const router = express.Router();

// 運用計画（スケジュール）の一覧取得
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    const tablePath = await getTablePath('schedules');
    
    let query = `SELECT * FROM ${tablePath}`;
    const params = [];
    
    if (month) {
      query += ' WHERE TO_CHAR(plan_date, \'YYYY-MM\') = $1';
      params.push(month);
    }
    
    query += ' ORDER BY plan_date, vehicle_id';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 運用計画（スケジュール）の作成
router.post('/', async (req, res) => {
  try {
    const { 
      vehicle_id, 
      plan_date, 
      end_date, 
      shift_type, 
      start_time, 
      end_time, 
      planned_distance, 
      departure_base_id, 
      arrival_base_id, 
      notes 
    } = req.body;
    const tablePath = await getTablePath('schedules');
    
    const query = `
      INSERT INTO ${tablePath} 
        (vehicle_id, plan_date, end_date, shift_type, start_time, end_time, 
         planned_distance, departure_base_id, arrival_base_id, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      vehicle_id, 
      plan_date, 
      end_date, 
      shift_type, 
      start_time, 
      end_time, 
      planned_distance || 0, 
      departure_base_id, 
      arrival_base_id, 
      notes
    ]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 運用計画（スケジュール）の更新
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      vehicle_id, 
      plan_date, 
      end_date, 
      shift_type, 
      start_time, 
      end_time, 
      planned_distance, 
      departure_base_id, 
      arrival_base_id, 
      notes 
    } = req.body;
    const tablePath = await getTablePath('schedules');
    
    const query = `
      UPDATE ${tablePath} 
      SET vehicle_id = $1, plan_date = $2, end_date = $3, shift_type = $4, 
          start_time = $5, end_time = $6, planned_distance = $7, 
          departure_base_id = $8, arrival_base_id = $9, notes = $10,
          updated_at = CURRENT_TIMESTAMP
      WHERE schedule_id = $11
      RETURNING *
    `;
    
    const result = await db.query(query, [
      vehicle_id, 
      plan_date, 
      end_date, 
      shift_type, 
      start_time, 
      end_time, 
      planned_distance || 0, 
      departure_base_id, 
      arrival_base_id, 
      notes, 
      id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 運用計画（スケジュール）の削除
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tablePath = await getTablePath('schedules');
    
    const result = await db.query(
      `DELETE FROM ${tablePath} WHERE schedule_id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;
