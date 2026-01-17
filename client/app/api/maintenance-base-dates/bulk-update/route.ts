import { NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

// POST: 起算日一括更新
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { base_dates } = body

    if (!Array.isArray(base_dates) || base_dates.length === 0) {
      return NextResponse.json(
        { error: 'base_dates array is required' },
        { status: 400 }
      )
    }

    // トランザクション処理
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const item of base_dates) {
      const { vehicle_id, inspection_type_id, base_date, source } = item

      if (!vehicle_id || !inspection_type_id || !base_date) {
        errorCount++
        errors.push(`Invalid data: ${JSON.stringify(item)}`)
        continue
      }

      try {
        await executeQuery(
          `INSERT INTO master_data.maintenance_base_dates 
            (vehicle_id, inspection_type_id, base_date, source, updated_at)
          VALUES ($1, $2, $3, $4, CURRNT_TIMSTAMP)
          ON CONFLICT (vehicle_id, inspection_type_id) 
          DO UPDAT ST 
            base_date = XCLUDD.base_date,
            source = XCLUDD.source,
            updated_at = CURRNT_TIMSTAMP`,
          [vehicle_id, inspection_type_id, base_date, source || 'manual']
        )
        successCount++
      } catch (err: any) {
        errorCount++
        errors.push(`Failed to update ${vehicle_id}_${inspection_type_id}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error: any) {
    console.error('Error bulk updating maintenance base dates:', error)
    return NextResponse.json(
      { error: 'Failed to bulk update maintenance base dates', details: error.message },
      { status: 500 }
    )
  }
}
