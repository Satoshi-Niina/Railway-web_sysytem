import { NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

// GET: 特定の検修計画取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const result = await executeQuery(
      `SELECT 
        mp.*,
        m.machine_number,
        mt.model_name as machine_type,
        it.type_name as inspection_type
      FROM master_data.maintenance_plans mp
      JOIN master_data.machines m ON mp.vehicle_id = m.id
      JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
      JOIN master_data.inspection_types it ON mp.inspection_type_id = it.id
      WHERE mp.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Maintenance plan not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])

  } catch (error: any) {
    console.error('Error fetching maintenance plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance plan', details: error.message },
      { status: 500 }
    )
  }
}

// PUT: 検修計画更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const {
      planned_start_date,
      planned_end_date,
      actual_start_date,
      actual_end_date,
      status,
      notes
    } = body

    const result = await executeQuery(
      `UPDATE master_data.maintenance_plans 
      SET 
        planned_start_date = COALESCE($1, planned_start_date),
        planned_end_date = COALESCE($2, planned_end_date),
        actual_start_date = $3,
        actual_end_date = $4,
        status = COALESCE($5, status),
        notes = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *`,
      [
        planned_start_date,
        planned_end_date,
        actual_start_date || null,
        actual_end_date || null,
        status,
        notes || null,
        id
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Maintenance plan not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])

  } catch (error: any) {
    console.error('Error updating maintenance plan:', error)
    return NextResponse.json(
      { error: 'Failed to update maintenance plan', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE: 検修計画削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const result = await executeQuery(
      'DELETE FROM master_data.maintenance_plans WHERE id = $1 RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Maintenance plan not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, deleted: result.rows[0] })

  } catch (error: any) {
    console.error('Error deleting maintenance plan:', error)
    return NextResponse.json(
      { error: 'Failed to delete maintenance plan', details: error.message },
      { status: 500 }
    )
  }
}
