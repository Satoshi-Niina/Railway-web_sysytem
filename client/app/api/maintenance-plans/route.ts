import { NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

// GET: 検修計画一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const vehicle_id = searchParams.get("vehicle_id")
    const month = searchParams.get("month")

    let query = `
      SELECT 
        mp.*,
        m.machine_number,
        mt.model_name as machine_type,
        it.type_name as inspection_type
      FROM master_data.maintenance_plans mp
      JOIN master_data.machines m ON mp.vehicle_id = m.id
      JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
      JOIN master_data.inspection_types it ON mp.inspection_type_id = it.id
      WHERE 1=1
    `
    const params: any[] = []
    let paramCount = 1

    if (vehicle_id) {
      query += ` AND mp.vehicle_id = $${paramCount}`
      params.push(vehicle_id)
      paramCount++
    }

    if (month) {
      query += ` AND DATE_TRUNC('month', mp.planned_start_date) = DATE_TRUNC('month', $${paramCount}::date)`
      params.push(`${month}-01`)
      paramCount++
    }

    query += ` ORDER BY mp.planned_start_date DESC`

    const result = await executeQuery(query, params)
    return NextResponse.json(result.rows)

  } catch (error: any) {
    console.error('Error fetching maintenance plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance plans', details: error.message },
      { status: 500 }
    )
  }
}

// POST: 検修計画作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      vehicle_id,
      inspection_type_id,
      planned_start_date,
      planned_end_date,
      actual_start_date,
      actual_end_date,
      status,
      notes
    } = body

    if (!vehicle_id || !inspection_type_id || !planned_start_date || !planned_end_date) {
      return NextResponse.json(
        { error: 'vehicle_id, inspection_type_id, planned_start_date, and planned_end_date are required' },
        { status: 400 }
      )
    }

    const result = await executeQuery(
      `INSERT INTO master_data.maintenance_plans 
        (vehicle_id, inspection_type_id, planned_start_date, planned_end_date, 
         actual_start_date, actual_end_date, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        vehicle_id,
        inspection_type_id,
        planned_start_date,
        planned_end_date,
        actual_start_date || null,
        actual_end_date || null,
        status || 'scheduled',
        notes || null
      ]
    )

    return NextResponse.json(result.rows[0])

  } catch (error: any) {
    console.error('Error creating maintenance plan:', error)
    return NextResponse.json(
      { error: 'Failed to create maintenance plan', details: error.message },
      { status: 500 }
    )
  }
}
