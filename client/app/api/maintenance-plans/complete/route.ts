import { NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

// POST: 検修完了処理（起算日を自動更新）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vehicle_id, inspection_type_id, completion_date, notes } = body

    if (!vehicle_id || !inspection_type_id || !completion_date) {
      return NextResponse.json(
        { error: 'vehicle_id, inspection_type_id, and completion_date are required' },
        { status: 400 }
      )
    }

    // 検修完了日を次回の起算日として更新
    const result = await executeQuery(
      `INSERT INTO master_data.maintenance_base_dates 
        (vehicle_id, inspection_type_id, base_date, source, notes, updated_at)
      VALUES ($1, $2, $3, 'completion', $4, CURRENT_TIMESTAMP)
      ON CONFLICT (vehicle_id, inspection_type_id) 
      DO UPDATE SET 
        base_date = EXCLUDED.base_date,
        source = 'completion',
        notes = CASE 
          WHEN EXCLUDED.notes IS NOT NULL THEN EXCLUDED.notes 
          ELSE master_data.maintenance_base_dates.notes 
        END,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [vehicle_id, inspection_type_id, completion_date, notes]
    )

    return NextResponse.json({
      success: true,
      message: '検修完了処理が完了しました。次回の起算日が更新されました。',
      base_date: result.rows[0]
    })

  } catch (error: any) {
    console.error('Error completing maintenance:', error)
    return NextResponse.json(
      { error: 'Failed to complete maintenance', details: error.message },
      { status: 500 }
    )
  }
}
