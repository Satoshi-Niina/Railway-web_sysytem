import { NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

// PUT: 特定の起算日を更新
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
        { error: 'base_date is required' },
        { status: 400 }
      )
    }

    const result = await executeQuery(
      `INSERT INTO master_data.maintenance_base_dates 
        (vehicle_id, inspection_type_id, base_date, source, notes, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (vehicle_id, inspection_type_id) 
      DO UPDATE SET 
        base_date = EXCLUDED.base_date,
        source = EXCLUDED.source,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [vehicle_id, inspection_type_id, base_date, source || 'manual', notes]
    )

    return NextResponse.json(result.rows[0])

  } catch (error: any) {
    console.error('Error updating maintenance base date:', error)
    return NextResponse.json(
      { error: 'Failed to update maintenance base date', details: error.message },
      { status: 500 }
    )
  }
}

// GET: 特定の起算日を取得
export async function GET(
  request: NextRequest,
  { params }: { params: { vehicle_id: string; inspection_type_id: string } }
) {
  try {
    const { vehicle_id, inspection_type_id } = params

    const result = await executeQuery(
      `SELECT * FROM master_data.maintenance_base_dates
       WHERE vehicle_id = $1 AND inspection_type_id = $2`,
      [vehicle_id, inspection_type_id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Base date not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])

  } catch (error: any) {
    console.error('Error fetching maintenance base date:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance base date', details: error.message },
      { status: 500 }
    )
  }
}
