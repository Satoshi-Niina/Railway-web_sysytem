import { NextRequest, NextResponse } from "next/server"
import { executeQuery, getDatabaseType } from "@/lib/database"

// GET: 検修スケジュール一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get("month")
    const machine_type = searchParams.get("machine_type")
    const machine_number = searchParams.get("machine_number")
    const vehicle_id = searchParams.get("vehicle_id")

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      let query = `
        WITH base_dates AS (
          -- 起算日を取得（実績優先、なければマスタの起算日、最後に購入日）
          SELECT 
            m.id::text as vehicle_id,
            it.id as inspection_type_id,
            COALSC(
              mbd.base_date,
              m.purchase_date,
              m.created_at::date
            ) as base_date,
            CAS 
              WHN mbd.base_date IS NOT NULL THN 'manual'
              WHN m.purchase_date IS NOT NULL THN 'purchase'
              LS 'system'
            ND as source
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
          m.id::text as vehicle_id,
          m.machine_number,
          mt.model_name as machine_type,
          it.id as inspection_type_id,
          it.type_name as inspection_type,
          it.category,
          bd.base_date,
          bd.source as base_date_source,
          s.cycle_months,
          s.duration_days,
          bd.base_date + (s.cycle_months || ' months')::INTRVAL as next_scheduled_date,
          (bd.base_date + (s.cycle_months || ' months')::INTRVAL)::date - CURRNT_DAT as days_until,
          CAS 
            WHN (bd.base_date + (s.cycle_months || ' months')::INTRVAL)::date - CURRNT_DAT <= 30 THN true
            LS false
          ND as is_warning,
          m.office_id,
          o.office_name
        FROM master_data.machines m
        JOIN master_data.machine_types mt ON m.machine_type_id = mt.type_code
        JOIN base_dates bd ON bd.vehicle_id = m.id
        JOIN master_data.inspection_types it ON bd.inspection_type_id = it.id
        LEFT JOIN schedules s ON (
          s.machine_id = mt.type_code OR s.machine_id = m.id::text
        ) AND s.inspection_type_id = it.id
        LEFT JOIN master_data.managements_offices o ON m.office_id::integer = o.office_id
        WHERE s.cycle_months IS NOT NULL
      `

      const params: any[] = []
      let paramCount = 1

      // 月フィルター
      if (month) {
        query += ` AND DATE_TRUNC('month', (bd.base_date + (s.cycle_months || ' months')::INTRVAL)::date) = DATE_TRUNC('month', $${paramCount}::date)`
        params.push(`${month}-01`)
        paramCount++
      }

      // 機種フィルター
      if (machine_type) {
        query += ` AND mt.model_name = $${paramCount}`
        params.push(machine_type)
        paramCount++
      }

      // 機械番号フィルター
      if (machine_number) {
        query += ` AND m.machine_number = $${paramCount}`
        params.push(machine_number)
        paramCount++
      }

      // 車両IDフィルター
      if (vehicle_id) {
        query += ` AND m.id = $${paramCount}`
        params.push(vehicle_id)
        paramCount++
      }

      query += ` ORDER BY next_scheduled_date, m.machine_number`

      const result = await executeQuery(query, params)
      return NextResponse.json(result)
    } else { return NextResponse.json([]) }
  } catch (error: any) {
    console.error("Error fetching maintenance schedules:", error)
    return NextResponse.json(
      { error: "Failed to fetch maintenance schedules" },
      { status: 500 }
    )
  }
}
