import pool from '../db.js';

// 検修スケジュール一覧取得
export const getMaintenanceSchedules = async (req, res) => {
  try {
    const { month, machine_type, machine_number, vehicle_id } = req.query;
    
    let query = `
      WITH base_dates AS (
        -- 起算日を取得（実績優先、なければマスタの起算日、最後に購入日）
        SELECT 
          m.id::text as vehicle_id,
          it.id as inspection_type_id,
          COALESCE(
            (SELECT MAX(inspection_date) 
             FROM inspections.vehicle_inspection_records vir 
             WHERE vir.vehicle_id = m.id 
             AND vir.inspection_type = it.type_name),
            mbd.base_date,
            m.purchase_date,
            m.created_at::date
          ) as base_date,
          CASE 
            WHEN EXISTS (SELECT 1 FROM inspections.vehicle_inspection_records vir 
                        WHERE vir.vehicle_id = m.id AND vir.inspection_type = it.type_name)
            THEN 'completion'
            WHEN mbd.base_date IS NOT NULL THEN 'manual'
            WHEN m.purchase_date IS NOT NULL THEN 'purchase'
            ELSE 'system'
          END as source
        FROM master_data.machines m
        CROSS JOIN master_data.inspection_types it
        LEFT JOIN master_data.maintenance_base_dates mbd 
          ON mbd.vehicle_id = m.id AND mbd.inspection_type_id = it.id
      ),
      schedules AS (
        -- 検修スケジュールを取得（機種レベルまたは個別機械レベル）
        SELECT 
          s.machine_id,
          s.inspection_type_id,
          s.cycle_months,
          s.duration_days,
          s.is_active
        FROM master_data.inspection_schedules s
        WHERE s.is_active = true
      )
      SELECT 
        m.id as vehicle_id,
        m.machine_number,
        mt.model_name as machine_type,
        it.id as inspection_type_id,
        it.type_name as inspection_type,
        it.category,
        bd.base_date,
        bd.source as base_date_source,
        s.cycle_months,
        s.duration_days,
        bd.base_date + (s.cycle_months || ' months')::INTERVAL as next_scheduled_date,
        (bd.base_date + (s.cycle_months || ' months')::INTERVAL)::date - CURRENT_DATE as days_until,
        CASE 
          WHEN (bd.base_date + (s.cycle_months || ' months')::INTERVAL)::date - CURRENT_DATE <= 30 THEN true
          ELSE false
        END as is_warning,
        m.office_id,
        o.office_name
      FROM master_data.machines m
      JOIN master_data.machine_types mt ON m.machine_type_id = mt.type_code
      JOIN base_dates bd ON bd.vehicle_id = m.id
      JOIN master_data.inspection_types it ON bd.inspection_type_id = it.id
      LEFT JOIN schedules s ON (
        s.machine_id = mt.type_code OR s.machine_id = m.id::text
      ) AND s.inspection_type_id = it.id
      LEFT JOIN master_data.management_offices o ON m.office_id::integer = o.office_id
      WHERE s.cycle_months IS NOT NULL
    `;
    
    const params = [];
    let paramCount = 1;
    
    // 月フィルター
    if (month) {
      query += ` AND DATE_TRUNC('month', (bd.base_date + (s.cycle_months || ' months')::INTERVAL)::date) = DATE_TRUNC('month', $${paramCount}::date)`;
      params.push(`${month}-01`);
      paramCount++;
    }
    
    // 機種フィルター
    if (machine_type) {
      query += ` AND mt.model_name = $${paramCount}`;
      params.push(machine_type);
      paramCount++;
    }
    
    // 機械番号フィルター
    if (machine_number) {
      query += ` AND m.machine_number = $${paramCount}`;
      params.push(machine_number);
      paramCount++;
    }
    
    // 車両IDフィルター
    if (vehicle_id) {
      query += ` AND m.id = $${paramCount}`;
      params.push(vehicle_id);
      paramCount++;
    }
    
    query += ` ORDER BY next_scheduled_date, m.machine_number`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching maintenance schedules:', err);
    res.status(500).json({ 
      error: 'Failed to fetch maintenance schedules', 
      details: err.message 
    });
  }
};

// 特定車両・検修種別のスケジュール取得
export const getMaintenanceScheduleById = async (req, res) => {
  try {
    const { vehicle_id, inspection_type_id } = req.params;
    
    const query = `
      WITH base_date AS (
        SELECT 
          COALESCE(
            (SELECT MAX(inspection_date) 
             FROM inspections.vehicle_inspection_records vir 
             WHERE vir.vehicle_id = $1
             AND vir.inspection_type = (SELECT type_name FROM master_data.inspection_types WHERE id = $2)),
            mbd.base_date,
            m.purchase_date,
            m.created_at::date
          ) as base_date
        FROM master_data.machines m
        LEFT JOIN master_data.maintenance_base_dates mbd 
          ON mbd.vehicle_id = m.id AND mbd.inspection_type_id = $2
        WHERE m.id = $1
      )
      SELECT 
        m.id as vehicle_id,
        m.machine_number,
        mt.model_name as machine_type,
        it.type_name as inspection_type,
        s.cycle_months,
        s.duration_days,
        bd.base_date,
        bd.base_date + (s.cycle_months || ' months')::INTERVAL as next_scheduled_date
      FROM master_data.machines m
      JOIN master_data.machine_types mt ON m.machine_type_id = mt.type_code
      CROSS JOIN base_date bd
      JOIN master_data.inspection_types it ON it.id = $2
      LEFT JOIN master_data.inspection_schedules s ON (
        s.machine_id = mt.type_code OR s.machine_id = m.id::text
      ) AND s.inspection_type_id = $2
      WHERE m.id = $1
    `;
    
    const result = await pool.query(query, [vehicle_id, inspection_type_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Maintenance schedule not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching maintenance schedule:', err);
    res.status(500).json({ 
      error: 'Failed to fetch maintenance schedule', 
      details: err.message 
    });
  }
};

// 起算日の更新
export const updateBaseDate = async (req, res) => {
  try {
    const { vehicle_id, inspection_type_id } = req.params;
    const { base_date, source, notes } = req.body;
    
    if (!base_date) {
      return res.status(400).json({ error: 'base_date is required' });
    }
    
    const query = `
      INSERT INTO master_data.maintenance_base_dates 
        (vehicle_id, inspection_type_id, base_date, source, notes)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (vehicle_id, inspection_type_id) 
      DO UPDATE SET 
        base_date = EXCLUDED.base_date,
        source = EXCLUDED.source,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      vehicle_id,
      inspection_type_id,
      base_date,
      source || 'manual',
      notes
    ]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating base date:', err);
    res.status(500).json({ 
      error: 'Failed to update base date', 
      details: err.message 
    });
  }
};
