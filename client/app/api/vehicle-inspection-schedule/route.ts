import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseType, executeQuery } from "@/lib/database"

// GET: 車両の検査予定を取得（運用計画期間の予告表示用）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get("vehicle_id")
    const month = searchParams.get("month") // YYYY-MM形式
    const showWarnings = searchParams.get("show_warnings") === "true" // 予告のみ表示

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      if (month) {
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
              v.machine_number,
              v.vehicle_type,
              li.inspection_type as last_inspection_type,
              li.inspection_date as last_inspection_date,
              li.cycle_order as last_cycle_order,
              ico.inspection_type as next_inspection_type,
              ico.cycle_order as next_cycle_order,
              ico.cycle_months,
              ico.warning_months,
              li.inspection_date + (ico.cycle_months || ' months')::interval as next_inspection_date,
              li.inspection_date + ((ico.cycle_months - ico.warning_months) || ' months')::interval as warning_start_date
            FROM latest_inspections li
            JOIN master_data.vehicles v ON li.vehicle_id = v.id
            LEFT JOIN inspections.inspection_cycle_order ico ON 
              ico.vehicle_type = v.vehicle_type AND 
              ico.cycle_order = (
                SELECT MIN(cycle_order) 
                FROM inspections.inspection_cycle_order 
                WHERE vehicle_type = v.vehicle_type 
                AND cycle_order > li.cycle_order
                AND is_active = true
              )
            WHERE v.status = 'active'
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
            EXTRACT(day FROM (next_inspection_date::date - CURRENT_DATE)::interval) as days_until_inspection
          FROM next_cycle nc
          WHERE 1=1
        `

        const params: any[] = [startDate, endDate]
        let paramIndex = 3

        if (vehicleId) {
          query += ` AND nc.vehicle_id = $${paramIndex}`
          params.push(Number(vehicleId))
          paramIndex++
        }

        if (showWarnings) {
          query += ` AND is_warning = true`
        }

        query += ` ORDER BY nc.vehicle_id, next_inspection_date`

        const data = await executeQuery(query, params)
        return NextResponse.json(data)
      } else if (vehicleId) {
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
            v.machine_number,
            v.vehicle_type,
            ico.inspection_type as next_inspection_type,
            ico.cycle_order as next_cycle_order,
            ico.cycle_months,
            ico.warning_months,
            li.inspection_date + (ico.cycle_months || ' months')::interval as next_inspection_date
          FROM latest_inspection li
          JOIN master_data.vehicles v ON li.vehicle_id = v.id
          LEFT JOIN inspections.inspection_cycle_order ico ON 
            ico.vehicle_type = v.vehicle_type AND 
            ico.cycle_order = (
              SELECT MIN(cycle_order) 
              FROM inspections.inspection_cycle_order 
              WHERE vehicle_type = v.vehicle_type 
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
    console.error("Error fetching vehicle inspection schedule:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch vehicle inspection schedule",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
