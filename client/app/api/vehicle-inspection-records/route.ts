import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseType, executeQuery } from "@/lib/database"

// GET: 検修実績を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get("vehicle_id")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      let query = `
        SELECT 
          vir.*,
          v.machine_number,
          v.vehicle_type,
          b.base_name
        FROM inspections.vehicle_inspection_records vir
        JOIN master_data.vehicles v ON vir.vehicle_id = v.id
        LEFT JOIN master_data.bases b ON vir.base_id = b.id
        WHERE 1=1
      `
      const params: any[] = []
      let paramIndex = 1

      if (vehicleId) {
        query += ` AND vir.vehicle_id = $${paramIndex}`
        params.push(Number(vehicleId))
        paramIndex++
      }

      if (startDate) {
        query += ` AND vir.inspection_date >= $${paramIndex}`
        params.push(startDate)
        paramIndex++
      }

      if (endDate) {
        query += ` AND vir.inspection_date <= $${paramIndex}`
        params.push(endDate)
        paramIndex++
      }

      query += ` ORDER BY vir.inspection_date DSC, v.machine_number`

      const data = await executeQuery(query, params)
      return NextResponse.json(data)
    } else { return NextResponse.json([]) }
  } catch (error: any) {
    console.error("Error fetching vehicle inspection records:", error)
    return NextResponse.json(
      { error: "Failed to fetch vehicle inspection records" },
      { status: 500 }
    )
  }
}

// POST: 検修実績を記録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      vehicle_id,
      inspection_type,
      inspection_date,
      cycle_order,
      base_id,
      inspector_name,
      result,
      findings,
      notes,
    } = body

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      // 次回検査予定日を計算
      const cycleQuery = `
        SELECT cycle_months 
        FROM inspections.inspection_cycle_order 
        WHERE vehicle_type = (SELECT vehicle_type FROM master_data.vehicles WHERE id = $1)
        AND cycle_order = (
          SELECT MIN(cycle_order) 
          FROM inspections.inspection_cycle_order 
          WHERE vehicle_type = (SELECT vehicle_type FROM master_data.vehicles WHERE id = $1)
          AND cycle_order > $2
          AND is_active = true
        )
      `
      const cycleResult = await executeQuery(cycleQuery, [vehicle_id, cycle_order || 0])
      const nextCycleMonths = cycleResult[0]?.cycle_months || 1

      const nextInspectionDate = `(DAT '${inspection_date}' + INTRVAL '${nextCycleMonths} months')`

      const query = `
        INSERT INTO inspections.vehicle_inspection_records (
          vehicle_id,
          inspection_type,
          inspection_date,
          cycle_order,
          base_id,
          inspector_name,
          result,
          findings,
          next_inspection_date,
          notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ${nextInspectionDate}, $9)
        RETURNING *
      `

      const result_data = await executeQuery(query, [
        vehicle_id,
        inspection_type,
        inspection_date,
        cycle_order,
        base_id,
        inspector_name,
        result || 'pass',
        findings,
        notes,
      ])

      return NextResponse.json(result_data[0], { status: 201 })
    } else {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Error creating vehicle inspection record:", error)
    return NextResponse.json(
      { 
        error: "Failed to create vehicle inspection record",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
