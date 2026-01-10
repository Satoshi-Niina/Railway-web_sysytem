import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseType, executeQuery } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const officeId = searchParams.get("officeId")
    const vehicleType = searchParams.get("vehicleType")

    if (!month) {
      return NextResponse.json(
        { error: "月の指定が必要です" },
        { status: 400 }
      )
    }

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      try {
        // 当月の開始日と終了日を計算
        const dateParts = month.split('-')
        const year = parseInt(dateParts[0], 10)
        const monthNum = parseInt(dateParts[1], 10)
        
        const monthStart = `${year}-${String(monthNum).padStart(2, '0')}-01`
        const nextMonth = monthNum === 12 ? 1 : monthNum + 1
        const nextYear = monthNum === 12 ? year + 1 : year
        const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
        
        let query = `
          SELECT op.id, op.vehicle_id, op.plan_date, op.end_date, op.shift_type,
                 op.start_time, op.end_time, op.planned_distance,
                 op.departure_base_id, op.arrival_base_id, op.notes, op.status,
                 m.machine_number, mt.type_name as vehicle_type, mt.model_name as model,
                 m.purchase_date as acquisition_date, m.office_id as management_office_id,
                 db.base_name as departure_base_name, db.location as departure_base_location,
                 ab.base_name as arrival_base_name, ab.location as arrival_base_location
          FROM operations.operation_plans op
          LEFT JOIN master_data.machines m ON op.vehicle_id::text = m.id::text
          LEFT JOIN master_data.machine_types mt ON m.machine_type_id::text = mt.id::text
          LEFT JOIN master_data.bases db ON op.departure_base_id::text = db.base_id::text
          LEFT JOIN master_data.bases ab ON op.arrival_base_id::text = ab.base_id::text
          WHERE (
            (op.plan_date >= $1::date AND op.plan_date < $2::date)
            OR (op.end_date >= $1::date AND op.end_date < $2::date)
            OR (op.plan_date < $1::date AND op.end_date >= $2::date)
          )
        `
        const params: (string | number)[] = [monthStart, monthEnd]

        if (officeId && officeId !== "all") {
          query += ` AND m.office_id = $${params.length + 1}::text`
          params.push(officeId)
        }

        if (vehicleType && vehicleType !== "all") {
          query += ` AND mt.type_name = $${params.length + 1}::text`
          params.push(vehicleType)
        }

        query += " ORDER BY op.plan_date, op.vehicle_id"

        const plans = await executeQuery<any>(query, params)
        
        // 日付をYYYY-MM-DD形式に正規化（タイムゾーンのずれを防ぐ）
        const normalizedPlans = plans.map(plan => {
          const formatDate = (date: any) => {
            if (date instanceof Date) {
              const y = date.getFullYear()
              const m = String(date.getMonth() + 1).padStart(2, '0')
              const d = String(date.getDate()).padStart(2, '0')
              return `${y}-${m}-${d}`
            } else if (typeof date === 'string' && date.includes('T')) {
              return date.split('T')[0]
            }
            return date
          }
          
          return {
            ...plan,
            plan_date: formatDate(plan.plan_date),
            end_date: formatDate(plan.end_date)
          }
        })
        
        return NextResponse.json(normalizedPlans)
      } catch (error) {
        console.error("PostgreSQL query failed:", error)
        return NextResponse.json(
          { error: "データベースの取得に失敗しました", details: error instanceof Error ? error.message : String(error) },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { error: "データベースが設定されていません" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error fetching operation plans:", error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    )
  }
}

// POST: 新規運用計画作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      try {
        // operation_plans テーブルへ挿入
        const result = await executeQuery(
          `INSERT INTO operations.operation_plans (
            vehicle_id, plan_date, end_date, shift_type, start_time, end_time,
            planned_distance, departure_base_id, arrival_base_id, notes, status
          ) VALUES ($1, $2::date, $3::date, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
          [
            body.vehicle_id,
            body.plan_date,
            body.end_date || body.plan_date,
            body.shift_type || 'day',
            body.start_time || '08:00',
            body.end_time || '17:00',
            body.planned_distance || 0,
            body.departure_base_id || null,
            body.arrival_base_id || null,
            body.notes || '',
            'planned'
          ]
        )
        const formatDate = (date: any) => {
          if (date instanceof Date) {
            const y = date.getFullYear()
            const m = String(date.getMonth() + 1).padStart(2, '0')
            const d = String(date.getDate()).padStart(2, '0')
            return `${y}-${m}-${d}`
          } else if (typeof date === 'string' && date.includes('T')) {
            return date.split('T')[0]
          }
          return date
        }
        
        const normalizedResult = {
          ...result[0],
          plan_date: formatDate(result[0].plan_date),
          end_date: formatDate(result[0].end_date)
        }
        return NextResponse.json(normalizedResult)
      } catch (error) {
        console.error("PostgreSQL POST error:", error)
        return NextResponse.json(
          { error: "Failed to create operation plan", details: error instanceof Error ? error.message : String(error) },
          { status: 500 }
        )
      }
    }
    return NextResponse.json({ error: "Not supported" }, { status: 500 })
  } catch (error) {
    console.error("POST operation plan error:", error)
    return NextResponse.json({ error: "Failed to create operation plan" }, { status: 500 })
  }
}

// PUT, DELETEは /api/operation-plans/[id]/route.ts に実装されています
