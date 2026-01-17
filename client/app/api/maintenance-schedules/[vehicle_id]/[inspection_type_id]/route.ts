import { NextRequest, NextResponse } from "next/server"
import { executeQuery, getDatabaseType } from "@/lib/database"

// GET: 特定車両・検修種別のスケジュール取得
export async function GET(
  request: NextRequest,
  { params }: { params: { vehicle_id: string; inspection_type_id: string } }
) {
  try {
    const { vehicle_id, inspection_type_id } = params
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
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
          m.id::text as vehicle_id,
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
      `

      const result = await executeQuery(query, [vehicle_id, inspection_type_id])

      if (result.length === 0) {
        return NextResponse.json(
          { error: "Maintenance schedule not found" },
          { status: 404 }
        )
      }

      return NextResponse.json(result[0])
    } else {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error("Error fetching maintenance schedule:", error)
    return NextResponse.json(
      { error: "Failed to fetch maintenance schedule" },
      { status: 500 }
    )
  }
}

// PUT: 起算日の更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { vehicle_id: string; inspection_type_id: string } }
) {
  try {
    const { vehicle_id, inspection_type_id } = params
    const body = await request.json()
    const { base_date, source, notes } = body

    if (!base_date) {
      return NextResponse.json(
        { error: "base_date is required" },
        { status: 400 }
      )
    }

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
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
      `

      const result = await executeQuery(query, [
        vehicle_id,
        inspection_type_id,
        base_date,
        source || "manual",
        notes,
      ])

      return NextResponse.json(result[0])
    } else {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error("Error updating base date:", error)
    return NextResponse.json(
      { error: "Failed to update base date" },
      { status: 500 }
    )
  }
}
