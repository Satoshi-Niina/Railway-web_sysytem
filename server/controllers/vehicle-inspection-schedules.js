import pool from '../db.js';

// 車両検査スケジュール一覧取得
export const getVehicleInspectionSchedules = async (req, res) => {
  try {
    const { vehicle_id, inspection_type_id, active_only } = req.query;
    
    let query = `
      SELECT 
        vis.*,
        v.vehicle_type,
        v.machine_number,
        v.model,
        it.type_name,
        it.category as inspection_category,
        mo.office_name
      FROM master_data.vehicle_inspection_schedules vis
      JOIN master_data.vehicles v ON vis.vehicle_id = v.id
      JOIN master_data.inspection_types it ON vis.inspection_type_id = it.id
      LEFT JOIN master_data.management_offices mo ON v.management_office_id = mo.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (vehicle_id) {
      query += ` AND vis.vehicle_id = $${paramCount}`;
      params.push(vehicle_id);
      paramCount++;
    }
    
    if (inspection_type_id) {
      query += ` AND vis.inspection_type_id = $${paramCount}`;
      params.push(inspection_type_id);
      paramCount++;
    }
    
    if (active_only === 'true') {
      query += ` AND vis.is_active = true`;
    }
    
    query += ` ORDER BY v.vehicle_type, v.machine_number, it.interval_days`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching vehicle inspection schedules:', err);
    res.status(500).json({ error: 'Failed to fetch vehicle inspection schedules', details: err.message });
  }
};

// 車両検査スケジュール取得（単一）
export const getVehicleInspectionSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        vis.*,
        v.vehicle_type,
        v.machine_number,
        v.model,
        it.type_name,
        it.category as inspection_category,
        mo.office_name
      FROM master_data.vehicle_inspection_schedules vis
      JOIN master_data.vehicles v ON vis.vehicle_id = v.id
      JOIN master_data.inspection_types it ON vis.inspection_type_id = it.id
      LEFT JOIN master_data.management_offices mo ON v.management_office_id = mo.id
      WHERE vis.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle inspection schedule not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching vehicle inspection schedule:', err);
    res.status(500).json({ error: 'Failed to fetch vehicle inspection schedule', details: err.message });
  }
};

// 車両検査スケジュール新規作成
export const createVehicleInspectionSchedule = async (req, res) => {
  try {
    const {
      vehicle_id,
      inspection_type_id,
      last_inspection_date,
      next_inspection_date,
      interval_days,
      is_active = true,
      notes
    } = req.body;
    
    // 必須フィールドのチェック
    if (!vehicle_id || !inspection_type_id || !interval_days) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['vehicle_id', 'inspection_type_id', 'interval_days']
      });
    }
    
    const result = await pool.query(
      `INSERT INTO master_data.vehicle_inspection_schedules 
       (vehicle_id, inspection_type_id, last_inspection_date, next_inspection_date, interval_days, is_active, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [vehicle_id, inspection_type_id, last_inspection_date, next_inspection_date, interval_days, is_active, notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating vehicle inspection schedule:', err);
    
    // 重複キーエラーの場合
    if (err.code === '23505') {
      return res.status(409).json({ 
        error: 'This vehicle already has a schedule for this inspection type',
        details: err.message 
      });
    }
    
    res.status(500).json({ error: 'Failed to create vehicle inspection schedule', details: err.message });
  }
};

// 車両検査スケジュール更新
export const updateVehicleInspectionSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      last_inspection_date,
      next_inspection_date,
      interval_days,
      is_active,
      notes
    } = req.body;
    
    const result = await pool.query(
      `UPDATE master_data.vehicle_inspection_schedules 
       SET 
         last_inspection_date = COALESCE($1, last_inspection_date),
         next_inspection_date = COALESCE($2, next_inspection_date),
         interval_days = COALESCE($3, interval_days),
         is_active = COALESCE($4, is_active),
         notes = COALESCE($5, notes),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [last_inspection_date, next_inspection_date, interval_days, is_active, notes, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle inspection schedule not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating vehicle inspection schedule:', err);
    res.status(500).json({ error: 'Failed to update vehicle inspection schedule', details: err.message });
  }
};

// 車両検査スケジュール削除
export const deleteVehicleInspectionSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM master_data.vehicle_inspection_schedules WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle inspection schedule not found' });
    }
    
    res.json({ message: 'Vehicle inspection schedule deleted successfully', deleted: result.rows[0] });
  } catch (err) {
    console.error('Error deleting vehicle inspection schedule:', err);
    res.status(500).json({ error: 'Failed to delete vehicle inspection schedule', details: err.message });
  }
};

// 次回検査日の自動計算と更新
export const updateNextInspectionDate = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE master_data.vehicle_inspection_schedules 
       SET 
         last_inspection_date = CURRENT_DATE,
         next_inspection_date = CURRENT_DATE + (interval_days || ' days')::interval,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle inspection schedule not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating next inspection date:', err);
    res.status(500).json({ error: 'Failed to update next inspection date', details: err.message });
  }
};
