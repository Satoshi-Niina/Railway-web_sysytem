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
        const [year, monthNum] = month.split('-').map(Number)
        const monthStart = `${year}-${String(monthNum).padStart(2, '0')}-01`
        const nextMonth = monthNum === 12 ? 1 : monthNum + 1
        const nextYear = monthNum === 12 ? year + 1 : year
        const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
        
        let query = `
          SELECT op.*, 
                 v.machine_number, v.vehicle_type, v.model, v.manufacturer,
                 v.acquisition_date, v.management_office_id,
                 v.status as vehicle_status, v.created_at as vehicle_created_at,
                 v.updated_at as vehicle_updated_at,
                 db.base_name as departure_base_name, db.location as departure_base_location,
                 ab.base_name as arrival_base_name, ab.location as arrival_base_location
          FROM operations.operation_plans op
          LEFT JOIN master_data.vehicles v ON op.vehicle_id = v.id
          LEFT JOIN master_data.bases db ON op.departure_base_id = db.id
          LEFT JOIN master_data.bases ab ON op.arrival_base_id = ab.id
          WHERE (op.plan_date >= $1::date AND op.plan_date < $2::date)
             OR (COALESCE(op.end_date, op.plan_date) >= $1::date AND op.plan_date < $2::date)
        `
        const params: (string | number)[] = [monthStart, monthEnd]

        if (officeId && officeId !== "all") {
          query += ` AND v.management_office_id = $${params.length + 1}`
          params.push(officeId)
        }

        if (vehicleType && vehicleType !== "all") {
          query += ` AND v.vehicle_type = $${params.length + 1}`
          params.push(vehicleType)
        }

        query += " ORDER BY op.plan_date, op.vehicle_id"

        const plans = await executeQuery(query, params)
        
        // 日付をYYYY-MM-DD形式に正規化（タイムゾーンのずれを防ぐ）
        const normalizedPlans = plans.map(plan => {
          // Dateオブジェクトの場合、ローカルタイムゾーンで日付を取得
          const formatDate = (date: any) => {
            if (date instanceof Date) {
              const year = date.getFullYear()
              const month = String(date.getMonth() + 1).padStart(2, '0')
              const day = String(date.getDate()).padStart(2, '0')
              return `${year}-${month}-${day}`
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
        console.error("Query:", query)
        console.error("Params:", params)
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
        console.log("Creating operation plan:", body)
        const result = await executeQuery(
          `INSERT INTO operations.operation_plans (
            vehicle_id, plan_date, end_date, shift_type, start_time, end_time, 
            planned_distance, departure_base_id, arrival_base_id, notes, status
          ) VALUES ($1, $2::date, $3::date, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
          [
            body.vehicle_id, body.plan_date, body.end_date || body.plan_date, body.shift_type, body.start_time, body.end_time,
            body.planned_distance, body.departure_base_id, body.arrival_base_id, body.notes, "planned"
          ]
        )
        // 日付を正規化（ローカルタイムゾーン対応）
        const formatDate = (date: any) => {
          if (date instanceof Date) {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
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
        console.log("Created operation plan:", normalizedResult)
        return NextResponse.json(normalizedResult)
      } catch (error) {
        console.error("Failed to insert operation plan:", error)
        return NextResponse.json(
          { error: "Failed to create operation plan", details: error instanceof Error ? error.message : String(error) },
          { status: 500 }
        )
      }
    } else {
      // モックモード
      console.log("=== Creating new operation plan ===")
      console.log("Request body:", JSON.stringify(body, null, 2))
      
      // Mock data for vehicle and base are not available in this simplified version
      // This part of the mock logic needs to be re-evaluated or removed if not applicable
      const newPlan = {
        id: Date.now(),
        vehicle_id: body.vehicle_id,
        plan_date: body.plan_date,
        shift_type: body.shift_type,
        start_time: body.start_time,
        end_time: body.end_time,
        planned_distance: body.planned_distance,
        departure_base_id: body.departure_base_id,
        arrival_base_id: body.arrival_base_id,
        notes: body.notes,
        status: "planned",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log("Created new plan:", JSON.stringify(newPlan, null, 2))
      
      // mockOperationPlans.push(newPlan) // This line was removed as mockOperationPlans is no longer defined
      console.log("Total plans after creation:", 0) // No mock data, so 0
      
      return NextResponse.json(newPlan)
    }
  } catch (error) {
    console.error("Error creating operation plan:", error)
    return NextResponse.json({ error: "Failed to create operation plan" }, { status: 500 })
  }
}

// PUT: 運用計画更新
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const body = await request.json()
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      const result = await executeQuery(
        `UPDATE operation_plans SET 
          vehicle_id = $1, plan_date = $2, shift_type = $3, start_time = $4, end_time = $5,
          planned_distance = $6, departure_base_id = $7, arrival_base_id = $8, notes = $9, updated_at = NOW()
        WHERE id = $10 RETURNING *`,
        [
          body.vehicle_id, body.plan_date, body.shift_type, body.start_time, body.end_time,
          body.planned_distance, body.departure_base_id, body.arrival_base_id, body.notes, id
        ]
      )
      return NextResponse.json(result[0])
    } else {
      // モックモード
      console.log("=== Updating operation plan ===")
      console.log("Plan ID:", id)
      console.log("Request body:", JSON.stringify(body, null, 2))
      
      // mockOperationPlans is no longer defined, so this part cannot work as intended
      // This section needs to be re-evaluated or removed if not applicable
      const updatedPlan = {
        ...body, // Assuming body contains all fields for update
        updated_at: new Date().toISOString()
      }
      
      console.log("Updated plan:", JSON.stringify(updatedPlan, null, 2))
      
      // mockOperationPlans[planIndex] = updatedPlan // This line was removed
      console.log("Total plans after update:", 0) // No mock data, so 0
      
      return NextResponse.json(updatedPlan)
    }
  } catch (error) {
    console.error("Error updating operation plan:", error)
    return NextResponse.json({ error: "Failed to update operation plan" }, { status: 500 })
  }
}

// DELETE: 運用計画削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      await executeQuery("DELETE FROM operation_plans WHERE id = $1", [id])
      return NextResponse.json({ success: true })
    } else {
      // モックモード
      const planIndex = -1 // No mock data, so -1
      if (planIndex === -1) {
        return NextResponse.json({ error: "Plan not found" }, { status: 404 })
      }
      
      // mockOperationPlans.splice(planIndex, 1) // This line was removed
      console.log("Total plans after deletion:", 0) // No mock data, so 0
      
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error("Error deleting operation plan:", error)
    return NextResponse.json({ error: "Failed to delete operation plan" }, { status: 500 })
  }
}
