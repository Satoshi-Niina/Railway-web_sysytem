import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseType, executeQuery } from "@/lib/database"

// 運用計画から運用実績を作成するAPI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { plan_id } = body

    if (!plan_id) {
      return NextResponse.json(
        { error: "plan_id is required" },
        { status: 400 }
      )
    }

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      // 運用計画を取得
      const plans = await executeQuery(
        `SELECT * FROM operation_plans WHERE id = $1`,
        [plan_id]
      )

      if (plans.length === 0) {
        return NextResponse.json(
          { error: "運用計画が見つかりません" },
          { status: 404 }
        )
      }

      const plan = plans[0]

      // 既に実績が存在するかチェック
      const existingRecords = await executeQuery(
        `SELECT * FROM operation_records WHERE operation_plan_id = $1`,
        [plan_id]
      )

      if (existingRecords.length > 0) {
        return NextResponse.json(
          { error: "既に実績が存在します", record: existingRecords[0] },
          { status: 409 }
        )
      }

      // 運用計画から運用実績を作成
      const result = await executeQuery(
        `INSERT INTO operation_records (
          operation_plan_id, vehicle_id, record_date, shift_type,
          start_time, end_time, actual_distance, 
          departure_base_id, arrival_base_id, 
          notes, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [
          plan.id,
          plan.vehicle_id,
          plan.plan_date,
          plan.shift_type,
          plan.start_time,
          plan.end_time,
          plan.planned_distance || 0, // 計画距離を実績距離の初期値とする
          plan.departure_base_id,
          plan.arrival_base_id,
          plan.notes || "",
          "completed" // デフォルトで完了状態
        ]
      )

      return NextResponse.json(result[0])
    } else {
      // モックモード
      console.log("=== Creating operation record from plan ===")
      console.log("Plan ID:", plan_id)

      const mockRecord = {
        id: Date.now(),
        operation_plan_id: plan_id,
        vehicle_id: 1,
        record_date: new Date().toISOString().slice(0, 10),
        shift_type: "day",
        start_time: "08:00",
        end_time: "17:00",
        actual_distance: 50,
        departure_base_id: 1,
        arrival_base_id: 1,
        notes: "計画から自動作成",
        status: "completed",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      return NextResponse.json(mockRecord)
    }
  } catch (error) {
    console.error("Error creating operation record from plan:", error)
    return NextResponse.json(
      { error: "Failed to create operation record" },
      { status: 500 }
    )
  }
}

// 複数の運用計画から一括で運用実績を作成
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { month, vehicle_ids } = body

    if (!month) {
      return NextResponse.json(
        { error: "month is required" },
        { status: 400 }
      )
    }

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      // 指定月の運用計画を取得
      let query = `
        SELECT * FROM operation_plans
        WHERE plan_date LIKE $1
      `
      const params: any[] = [`${month}%`]

      if (vehicle_ids && vehicle_ids.length > 0) {
        query += ` AND vehicle_id = ANY($2)`
        params.push(vehicle_ids)
      }

      const plans = await executeQuery(query, params)

      // 既に実績が存在するものを除外
      const existingRecordPlanIds = await executeQuery(
        `SELECT operation_plan_id FROM operation_records WHERE operation_plan_id = ANY($1)`,
        [plans.map((p: any) => p.id)]
      )

      const existingIds = new Set(existingRecordPlanIds.map((r: any) => r.operation_plan_id))
      const plansToConvert = plans.filter((p: any) => !existingIds.has(p.id))

      // 一括で運用実績を作成
      const createdRecords = []
      for (const plan of plansToConvert) {
        const result = await executeQuery(
          `INSERT INTO operation_records (
            operation_plan_id, vehicle_id, record_date, shift_type,
            start_time, end_time, actual_distance,
            departure_base_id, arrival_base_id,
            notes, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
          [
            plan.id,
            plan.vehicle_id,
            plan.plan_date,
            plan.shift_type,
            plan.start_time,
            plan.end_time,
            plan.planned_distance || 0,
            plan.departure_base_id,
            plan.arrival_base_id,
            plan.notes || "",
            "completed"
          ]
        )
        createdRecords.push(result[0])
      }

      return NextResponse.json({
        created: createdRecords.length,
        skipped: plans.length - createdRecords.length,
        records: createdRecords
      })
    } else {
      // モックモード
      return NextResponse.json({
        created: 5,
        skipped: 2,
        records: []
      })
    }
  } catch (error) {
    console.error("Error batch creating operation records:", error)
    return NextResponse.json(
      { error: "Failed to batch create operation records" },
      { status: 500 }
    )
  }
}
