import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseType, executeQuery } from "@/lib/database"

// GET: 車両の検査予定を取得（運用計画期間の予告表示用）
export async function GET(request: NextRequest) {
  try {
    console.log('=== Vehicle Inspection Schedule API called ===')
    
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get("vehicle_id")
    const month = searchParams.get("month") // YYYY-MM形式
    const showWarnings = searchParams.get("show_warnings") === "true" // 予告のみ表示

    console.log('Parameters:', { vehicleId, month, showWarnings })

    const dbType = getDatabaseType()
    console.log('Database type:', dbType)

    if (dbType === "postgresql") {
      // テーブルの存在確認
      try {
        const tableCheck = await executeQuery(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'inspections' 
            AND table_name = 'vehicle_inspection_records'
          ) as records_exists,
          EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'inspections' 
            AND table_name = 'inspection_cycle_order'
          ) as cycle_exists
        `)
        
        console.log('Table check:', tableCheck[0])
        
        if (!tableCheck[0]?.records_exists || !tableCheck[0]?.cycle_exists) {
          console.log('Required inspection tables do not exist, returning empty array')
          return NextResponse.json([])
        }
      } catch (tableCheckError) {
        console.error('Table check error:', tableCheckError)
        return NextResponse.json([])
      }

      if (month) {
        // vehicle_inspection_recordsが空の場合でもエラーにならないように空配列を返す
        try {
          const checkRecordsQuery = `SELECT COUNT(*) FROM inspections.vehicle_inspection_records`
          const recordsCount = await executeQuery(checkRecordsQuery)
          
          console.log('Records count:', recordsCount[0])
          
          if (recordsCount[0]?.count === '0' || recordsCount[0]?.count === 0) {
            // 検査実績がない場合は空配列を返す
            console.log('No inspection records found, returning empty array')
            return NextResponse.json([])
          }
        } catch (countError) {
          console.error('Count check error:', countError)
          return NextResponse.json([])
        }

        // 特定月の検査予定と予告を取得
        const [year, monthNum] = month.split('-')
        const startDate = `${year}-${monthNum}-01`
        const endDate = `${year}-${String(Number(monthNum) + 1).padStart(2, '0')}-01`

        let query = `
          WITH latest_inspections AS (
            -- 各車両の最新検査実績を取得
            SELECT DISTINCT ON (vehicle_id)
              vehicle_id,
              inspection_type,
              inspection_date,
              cycle_order,
              next_inspection_date
            FROM inspections.vehicle_inspection_records
            ORDER BY vehicle_id, inspection_date DESC
          ),
          next_cycle AS (
            -- 次の検査サイクルを計算
            SELECT 
              li.vehicle_id,
              m.machine_number,
              mt.model_name as vehicle_type,
              li.inspection_type as last_inspection_type,
              li.inspection_date as last_inspection_date,
              li.cycle_order as last_cycle_order,
              ico.inspection_type as next_inspection_type,
              ico.cycle_order as next_cycle_order,
              ico.cycle_months,
              ico.warning_months,
              li.inspection_date + (INTERVAL '1 month' * ico.cycle_months) as next_inspection_date,
              li.inspection_date + (INTERVAL '1 month' * (ico.cycle_months - ico.warning_months)) as warning_start_date
            FROM latest_inspections li
            JOIN master_data.machines m ON li.vehicle_id = m.id
            LEFT JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
            LEFT JOIN inspections.inspection_cycle_order ico ON 
              ico.vehicle_type = mt.model_name AND 
              ico.cycle_order = (
                SELECT MIN(cycle_order) 
                FROM inspections.inspection_cycle_order 
                WHERE vehicle_type = mt.model_name 
                AND cycle_order > li.cycle_order
                AND is_active = true
              )
          )
          SELECT 
            nc.*,
            CASE 
              WHEN CURRENT_DATE >= warning_start_date::date THEN true
              ELSE false
            END as is_warning,
            CASE
              WHEN next_inspection_date::date BETWEEN $1::date AND $2::date THEN true
              ELSE false
            END as is_in_period,
            (next_inspection_date::date - CURRENT_DATE) as days_until_inspection
          FROM next_cycle nc
          WHERE 1=1
        `

        const params: any[] = [startDate, endDate]
        let paramIndex = 3

        if (vehicleId) {
          query += ` AND nc.vehicle_id = $${paramIndex}`
          params.push(vehicleId)
          paramIndex++
        }

        if (showWarnings) {
          query += ` AND CURRENT_DATE >= nc.warning_start_date::date`
        }

        query += ` ORDER BY nc.vehicle_id, next_inspection_date`

        const data = await executeQuery(query, params)
        return NextResponse.json(data)
      } else if (vehicleId) {
        // vehicle_inspection_recordsが空の場合はnullを返す
        const checkRecordsQuery = `SELECT COUNT(*) FROM inspections.vehicle_inspection_records WHERE vehicle_id = $1`
        const recordsCount = await executeQuery(checkRecordsQuery, [vehicleId])
        
        if (recordsCount[0]?.count === '0' || recordsCount[0]?.count === 0) {
          return NextResponse.json(null)
        }

        // 特定車両の次回検査予定を取得
        const query = `
          WITH latest_inspection AS (
            SELECT *
            FROM inspections.vehicle_inspection_records
            WHERE vehicle_id = $1
            ORDER BY inspection_date DESC
            LIMIT 1
          )
          SELECT 
            li.*,
            m.machine_number,
            mt.model_name as vehicle_type,
            ico.inspection_type as next_inspection_type,
            ico.cycle_order as next_cycle_order,
            ico.cycle_months,
            ico.warning_months,
            li.inspection_date + (INTERVAL '1 month' * ico.cycle_months) as next_inspection_date
          FROM latest_inspection li
          JOIN master_data.machines m ON li.vehicle_id = m.id
          LEFT JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
          LEFT JOIN inspections.inspection_cycle_order ico ON 
            ico.vehicle_type = mt.model_name AND 
            ico.cycle_order = (
              SELECT MIN(cycle_order) 
              FROM inspections.inspection_cycle_order 
              WHERE vehicle_type = mt.model_name 
              AND cycle_order > li.cycle_order
              AND is_active = true
            )
        `

        const data = await executeQuery(query, [vehicleId])
        return NextResponse.json(data[0] || null)
      } else {
        return NextResponse.json(
          { error: "vehicle_id or month parameter required" },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json([])
    }
  } catch (error) {
    console.error("❌ Error fetching vehicle inspection schedule")
    console.error("Error name:", error instanceof Error ? error.name : 'Unknown')
    console.error("Error message:", error instanceof Error ? error.message : String(error))
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace')
    console.error("Error code:", (error as any).code)
    
    return NextResponse.json(
      { 
        error: "Failed to fetch vehicle inspection schedule",
        details: error instanceof Error ? error.message : String(error),
        code: (error as any).code,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
