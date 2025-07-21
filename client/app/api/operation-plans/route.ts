import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseType, executeQuery, getSupabaseClient } from "@/lib/database"
import type { OperationPlan } from "@/types/database"

// グローバルな運用計画データストア（モックモード用）
let mockOperationPlans: OperationPlan[] = [
  // テストデータを追加（2024年1月）
  {
    id: 1,
    vehicle_id: 1,
    plan_date: "2024-01-01",
    shift_type: "day",
    start_time: "08:00",
    end_time: "17:00",
    planned_distance: 50,
    departure_base_id: 1,
    arrival_base_id: 1,
    notes: "テスト運用計画1",
    status: "planned",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    vehicle: {
      id: 1,
      machine_number: "M001",
      vehicle_type: "モータカー",
      model: "MC-100",
      manufacturer: "メーカーA",
      acquisition_date: "2020-04-01",
      management_office_id: 1,
      home_base_id: 1,
      status: "active",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    departure_base: {
      id: 1,
      base_name: "本社保守基地",
      base_type: "maintenance",
      location: "東京",
      management_office_id: 1,
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    arrival_base: {
      id: 1,
      base_name: "本社保守基地",
      base_type: "maintenance",
      location: "東京",
      management_office_id: 1,
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    }
  },
  // テストデータを追加（2024年1月、別の車両）
  {
    id: 2,
    vehicle_id: 2,
    plan_date: "2024-01-02",
    shift_type: "night",
    start_time: "22:00",
    end_time: "06:00",
    planned_distance: 80,
    departure_base_id: 1,
    arrival_base_id: 2,
    notes: "テスト運用計画2",
    status: "planned",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    vehicle: {
      id: 2,
      machine_number: "M002",
      vehicle_type: "MCR",
      model: "MCR-200",
      manufacturer: "メーカーA",
      acquisition_date: "2020-04-01",
      management_office_id: 1,
      home_base_id: 1,
      status: "active",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    departure_base: {
      id: 1,
      base_name: "本社保守基地",
      base_type: "maintenance",
      location: "東京",
      management_office_id: 1,
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    arrival_base: {
      id: 2,
      base_name: "関西保守基地",
      base_type: "maintenance",
      location: "大阪",
      management_office_id: 1,
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    }
  },
  // テストデータを追加（2024年2月）
  {
    id: 3,
    vehicle_id: 3,
    plan_date: "2024-02-01",
    shift_type: "day_night",
    start_time: "08:00",
    end_time: "06:00",
    planned_distance: 120,
    departure_base_id: 2,
    arrival_base_id: 3,
    notes: "テスト運用計画3",
    status: "planned",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    vehicle: {
      id: 3,
      machine_number: "M003",
      vehicle_type: "鉄トロ（10t）",
      model: "TT-10",
      manufacturer: "メーカーA",
      acquisition_date: "2020-04-01",
      management_office_id: 1,
      home_base_id: 1,
      status: "active",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    departure_base: {
      id: 2,
      base_name: "関西保守基地",
      base_type: "maintenance",
      location: "大阪",
      management_office_id: 1,
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    arrival_base: {
      id: 3,
      base_name: "中部保守基地",
      base_type: "maintenance",
      location: "名古屋",
      management_office_id: 1,
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    }
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const format = searchParams.get("format")
    const officeId = searchParams.get("office_id")
    const vehicleType = searchParams.get("vehicle_type")

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      let query = `
        SELECT op.*, 
               v.machine_number, v.vehicle_type, v.model,
               db.base_name as departure_base_name, db.location as departure_location,
               ab.base_name as arrival_base_name, ab.location as arrival_location
        FROM operation_plans op
        LEFT JOIN vehicles v ON op.vehicle_id = v.id
        LEFT JOIN bases db ON op.departure_base_id = db.id
        LEFT JOIN bases ab ON op.arrival_base_id = ab.id
      `
      const params: any[] = []
      let paramIndex = 1
      let whereConditions: string[] = []

      if (month) {
        whereConditions.push(`DATE_TRUNC('month', op.plan_date) = DATE_TRUNC('month', $${paramIndex}::date)`)
        params.push(`${month}-01`)
        paramIndex++
      }

      if (officeId && officeId !== "all") {
        whereConditions.push(`v.management_office_id = $${paramIndex}`)
        params.push(Number.parseInt(officeId))
        paramIndex++
      }

      if (vehicleType && vehicleType !== "all") {
        whereConditions.push(`v.vehicle_type = $${paramIndex}`)
        params.push(vehicleType)
        paramIndex++
      }

      if (whereConditions.length > 0) {
        query += " WHERE " + whereConditions.join(" AND ")
      }

      query += " ORDER BY op.plan_date, v.vehicle_type, v.machine_number"

      const plans = await executeQuery<OperationPlan>(query, params)
      
      // CSVエクスポートの場合
      if (format === "csv") {
        const csvData = convertToCSV(plans)
        return new NextResponse(csvData, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="operation-plans-${month || "all"}.csv"`,
          },
        })
      }
      
      return NextResponse.json(plans)
    } else if (dbType === "supabase") {
      let queryBuilder = getSupabaseClient()
        .from("operation_plans")
        .select(`
          *,
          vehicle:vehicles(*),
          departure_base:bases!departure_base_id(*),
          arrival_base:bases!arrival_base_id(*)
        `)

      if (month) {
        const startDate = `${month}-01`
        const endDate = `${month}-31`
        queryBuilder = queryBuilder.gte("plan_date", startDate).lte("plan_date", endDate)
      }

      if (officeId && officeId !== "all") {
        queryBuilder = queryBuilder.eq("vehicle.management_office_id", Number.parseInt(officeId))
      }

      if (vehicleType && vehicleType !== "all") {
        queryBuilder = queryBuilder.eq("vehicle.vehicle_type", vehicleType)
      }

      const { data, error } = await queryBuilder.order("plan_date")

      if (error) throw error
      
      // CSVエクスポートの場合
      if (format === "csv") {
        const csvData = convertToCSV(data)
        return new NextResponse(csvData, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="operation-plans-${month || "all"}.csv"`,
          },
        })
      }
      
      return NextResponse.json(data)
    } else {
      // モックデータ
      let plans = mockOperationPlans
      
      // デバッグ用：モックデータの状態をログ出力
      console.log("=== CSV Export Debug ===")
      console.log("Request parameters:", { month, format, officeId, vehicleType })
      console.log("Mock operation plans count:", plans.length)
      console.log("Mock operation plans:", JSON.stringify(plans, null, 2))
      
      // 月でフィルタリング
      if (month) {
        const originalCount = plans.length
        plans = plans.filter(plan => {
          const planMonth = plan.plan_date.substring(0, 7) // YYYY-MM形式
          const matches = planMonth === month
          console.log(`Plan ${plan.id}: ${plan.plan_date} (${planMonth}) matches ${month}: ${matches}`)
          return matches
        })
        console.log("Filtered by month:", month, "Count:", originalCount, "->", plans.length)
      }
      
      // 事業所でフィルタリング
      if (officeId && officeId !== "all") {
        const originalCount = plans.length
        plans = plans.filter(plan => {
          const matches = plan.vehicle?.management_office_id === Number.parseInt(officeId)
          console.log(`Plan ${plan.id}: office_id ${plan.vehicle?.management_office_id} matches ${officeId}: ${matches}`)
          return matches
        })
        console.log("Filtered by office:", officeId, "Count:", originalCount, "->", plans.length)
      }
      
      // 機種でフィルタリング
      if (vehicleType && vehicleType !== "all") {
        const originalCount = plans.length
        plans = plans.filter(plan => {
          const matches = plan.vehicle?.vehicle_type === vehicleType
          console.log(`Plan ${plan.id}: vehicle_type ${plan.vehicle?.vehicle_type} matches ${vehicleType}: ${matches}`)
          return matches
        })
        console.log("Filtered by vehicle type:", vehicleType, "Count:", originalCount, "->", plans.length)
      }
      
      // CSVエクスポートの場合
      if (format === "csv") {
        console.log("Converting to CSV, final plans count:", plans.length)
        console.log("Final plans for CSV:", JSON.stringify(plans, null, 2))
        const csvData = convertToCSV(plans)
        return new NextResponse(csvData, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="operation-plans-${month || "all"}.csv"`,
          },
        })
      }
      
      return NextResponse.json(plans)
    }
  } catch (error) {
    console.error("Error fetching operation plans:", error)
    return NextResponse.json({ error: "Failed to fetch operation plans" }, { status: 500 })
  }
}

// POST: 新規運用計画作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      const result = await executeQuery<OperationPlan>(
        `INSERT INTO operation_plans (
          vehicle_id, plan_date, shift_type, start_time, end_time, 
          planned_distance, departure_base_id, arrival_base_id, notes, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          body.vehicle_id, body.plan_date, body.shift_type, body.start_time, body.end_time,
          body.planned_distance, body.departure_base_id, body.arrival_base_id, body.notes, "planned"
        ]
      )
      return NextResponse.json(result[0])
    } else if (dbType === "supabase") {
      const supabase = getSupabaseClient()
      if (!supabase) {
        return NextResponse.json({ error: "Database not configured" }, { status: 500 })
      }
      
      const { data, error } = await supabase
        .from("operation_plans")
        .insert({
          vehicle_id: body.vehicle_id,
          plan_date: body.plan_date,
          shift_type: body.shift_type,
          start_time: body.start_time,
          end_time: body.end_time,
          planned_distance: body.planned_distance,
          departure_base_id: body.departure_base_id,
          arrival_base_id: body.arrival_base_id,
          notes: body.notes,
          status: "planned"
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    } else {
      // モックモード
      console.log("=== Creating new operation plan ===")
      console.log("Request body:", JSON.stringify(body, null, 2))
      
      const newPlan: OperationPlan = {
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
        updated_at: new Date().toISOString(),
        vehicle: getMockVehicle(body.vehicle_id),
        departure_base: getMockBase(body.departure_base_id),
        arrival_base: getMockBase(body.arrival_base_id)
      }
      
      console.log("Created new plan:", JSON.stringify(newPlan, null, 2))
      
      mockOperationPlans.push(newPlan)
      console.log("Total plans after creation:", mockOperationPlans.length)
      
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
      const result = await executeQuery<OperationPlan>(
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
    } else if (dbType === "supabase") {
      const supabase = getSupabaseClient()
      if (!supabase) {
        return NextResponse.json({ error: "Database not configured" }, { status: 500 })
      }
      
      const { data, error } = await supabase
        .from("operation_plans")
        .update({
          vehicle_id: body.vehicle_id,
          plan_date: body.plan_date,
          shift_type: body.shift_type,
          start_time: body.start_time,
          end_time: body.end_time,
          planned_distance: body.planned_distance,
          departure_base_id: body.departure_base_id,
          arrival_base_id: body.arrival_base_id,
          notes: body.notes,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    } else {
      // モックモード
      console.log("=== Updating operation plan ===")
      console.log("Plan ID:", id)
      console.log("Request body:", JSON.stringify(body, null, 2))
      
      const planIndex = mockOperationPlans.findIndex(plan => plan.id === Number.parseInt(id!))
      if (planIndex === -1) {
        console.log("Plan not found for ID:", id)
        return NextResponse.json({ error: "Plan not found" }, { status: 404 })
      }
      
      console.log("Found plan at index:", planIndex)
      console.log("Original plan:", JSON.stringify(mockOperationPlans[planIndex], null, 2))
      
      const updatedPlan: OperationPlan = {
        ...mockOperationPlans[planIndex],
        vehicle_id: body.vehicle_id,
        plan_date: body.plan_date,
        shift_type: body.shift_type,
        start_time: body.start_time,
        end_time: body.end_time,
        planned_distance: body.planned_distance,
        departure_base_id: body.departure_base_id,
        arrival_base_id: body.arrival_base_id,
        notes: body.notes,
        updated_at: new Date().toISOString(),
        vehicle: getMockVehicle(body.vehicle_id),
        departure_base: getMockBase(body.departure_base_id),
        arrival_base: getMockBase(body.arrival_base_id)
      }
      
      console.log("Updated plan:", JSON.stringify(updatedPlan, null, 2))
      
      mockOperationPlans[planIndex] = updatedPlan
      console.log("Total plans after update:", mockOperationPlans.length)
      
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
    } else if (dbType === "supabase") {
      const supabase = getSupabaseClient()
      if (!supabase) {
        return NextResponse.json({ error: "Database not configured" }, { status: 500 })
      }
      
      const { error } = await supabase.from("operation_plans").delete().eq("id", id)
      if (error) throw error
      return NextResponse.json({ success: true })
    } else {
      // モックモード
      const planIndex = mockOperationPlans.findIndex(plan => plan.id === Number.parseInt(id!))
      if (planIndex === -1) {
        return NextResponse.json({ error: "Plan not found" }, { status: 404 })
      }
      
      mockOperationPlans.splice(planIndex, 1)
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error("Error deleting operation plan:", error)
    return NextResponse.json({ error: "Failed to delete operation plan" }, { status: 500 })
  }
}

// 初期モックデータ生成関数
function generateInitialMockData(month: string, officeId?: string | null, vehicleType?: string | null): OperationPlan[] {
  const [year, monthNum] = month.split("-").map(Number)
  const daysInMonth = new Date(year, monthNum, 0).getDate()
  
  const vehicles = [
    { id: 1, machine_number: "M001", vehicle_type: "モータカー", model: "MC-100", management_office_id: 1 },
    { id: 2, machine_number: "M002", vehicle_type: "MCR", model: "MCR-200", management_office_id: 1 },
    { id: 3, machine_number: "M003", vehicle_type: "鉄トロ（10t）", model: "TT-10", management_office_id: 1 },
    { id: 4, machine_number: "M004", vehicle_type: "鉄トロ（15t）", model: "TT-15", management_office_id: 2 },
    { id: 5, machine_number: "M005", vehicle_type: "箱トロ", model: "HT-20", management_office_id: 2 }
  ]
  
  const bases = [
    { id: 1, base_name: "本社保守基地", location: "東京" },
    { id: 2, base_name: "関西保守基地", location: "大阪" },
    { id: 3, base_name: "中部保守基地", location: "名古屋" }
  ]
  
  // フィルターを適用
  let filteredVehicles = vehicles
  
  if (officeId && officeId !== "all") {
    filteredVehicles = filteredVehicles.filter(v => v.management_office_id === Number.parseInt(officeId))
  }
  
  if (vehicleType && vehicleType !== "all") {
    filteredVehicles = filteredVehicles.filter(v => v.vehicle_type === vehicleType)
  }
  
  const plans: OperationPlan[] = []
  
  // 1ヶ月分の運用計画を生成
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${month}-${day.toString().padStart(2, "0")}`
    const dayOfWeek = new Date(dateStr).getDay()
    
    filteredVehicles.forEach((vehicle, vehicleIndex) => {
      // 週末は運用を減らす
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        if (vehicleIndex % 2 === 0) return
      }
      
      // 運用パターンを決定
      let departureBase, arrivalBase, shiftType
      
      if (day === 1) {
        // 1日目：昼間の本社基地出入り
        departureBase = bases[0] // 本社保守基地
        arrivalBase = bases[0]   // 本社保守基地
        shiftType = "day"        // 昼間
      } else if (day === 2) {
        // 2日目：夜間で本社基地から関西保守基地へ移動
        departureBase = bases[0] // 本社保守基地
        arrivalBase = bases[1]   // 関西保守基地
        shiftType = "night"      // 夜間
      } else if (day === 3) {
        // 3日目：昼間の関西基地出入り
        departureBase = bases[1] // 関西保守基地
        arrivalBase = bases[1]   // 関西保守基地
        shiftType = "day"        // 昼間
      } else {
        // 4日目以降：パターンを繰り返す
        const patternDay = ((day - 1) % 3) + 1
        if (patternDay === 1) {
          // パターン1：昼間の本社基地出入り
          departureBase = bases[0]
          arrivalBase = bases[0]
          shiftType = "day"
        } else if (patternDay === 2) {
          // パターン2：夜間で本社基地から関西保守基地へ移動
          departureBase = bases[0]
          arrivalBase = bases[1]
          shiftType = "night"
        } else {
          // パターン3：昼間の関西基地出入り
          departureBase = bases[1]
          arrivalBase = bases[1]
          shiftType = "day"
        }
      }
      
      plans.push({
        id: Date.now() + plans.length,
        vehicle_id: vehicle.id,
        plan_date: dateStr,
        shift_type: shiftType,
        departure_base_id: departureBase.id,
        arrival_base_id: arrivalBase.id,
        planned_distance: Math.floor(Math.random() * 100) + 20,
        start_time: shiftType === "day" ? "08:00" : "22:00",
        end_time: shiftType === "day" ? "17:00" : "06:00",
        status: "planned",
        notes: `${vehicle.vehicle_type}の運用計画 - ${departureBase.base_name}から${arrivalBase.base_name}へ`,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        vehicle: {
          id: vehicle.id,
          machine_number: vehicle.machine_number,
          vehicle_type: vehicle.vehicle_type,
          model: vehicle.model,
          manufacturer: "メーカーA",
          acquisition_date: "2020-04-01",
          management_office_id: vehicle.management_office_id,
          home_base_id: 1,
          status: "active",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        departure_base: {
          id: departureBase.id,
          base_name: departureBase.base_name,
          base_type: "maintenance",
          location: departureBase.location,
          management_office_id: 1,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        arrival_base: {
          id: arrivalBase.id,
          base_name: arrivalBase.base_name,
          base_type: "maintenance",
          location: arrivalBase.location,
          management_office_id: 1,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      })
    })
  }
  
  return plans
}

// モック車両データ取得
function getMockVehicle(vehicleId: number) {
  const vehicles = [
    { id: 1, machine_number: "M001", vehicle_type: "モータカー", model: "MC-100", management_office_id: 1 },
    { id: 2, machine_number: "M002", vehicle_type: "MCR", model: "MCR-200", management_office_id: 1 },
    { id: 3, machine_number: "M003", vehicle_type: "鉄トロ（10t）", model: "TT-10", management_office_id: 1 },
    { id: 4, machine_number: "M004", vehicle_type: "鉄トロ（15t）", model: "TT-15", management_office_id: 2 },
    { id: 5, machine_number: "M005", vehicle_type: "箱トロ", model: "HT-20", management_office_id: 2 }
  ]
  
  const vehicle = vehicles.find(v => v.id === vehicleId)
  if (!vehicle) return null
  
  return {
    id: vehicle.id,
    machine_number: vehicle.machine_number,
    vehicle_type: vehicle.vehicle_type,
    model: vehicle.model,
    manufacturer: "メーカーA",
    acquisition_date: "2020-04-01",
    management_office_id: vehicle.management_office_id,
    home_base_id: 1,
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  }
}

// モック基地データ取得
function getMockBase(baseId: number | null) {
  if (!baseId) return null
  
  const bases = [
    { id: 1, base_name: "本社保守基地", location: "東京" },
    { id: 2, base_name: "関西保守基地", location: "大阪" },
    { id: 3, base_name: "中部保守基地", location: "名古屋" }
  ]
  
  const base = bases.find(b => b.id === baseId)
  if (!base) return null
  
  return {
    id: base.id,
    base_name: base.base_name,
    base_type: "maintenance",
    location: base.location,
    management_office_id: 1,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  }
}

// CSV変換関数
function convertToCSV(plans: any[]): string {
  // BOMを追加してExcelで正しく表示されるようにする
  const BOM = "\uFEFF"
  
  console.log("CSV conversion - Input plans:", plans)
  
  // CSVヘッダー
  const headers = [
    "日付",
    "機種",
    "機械番号",
    "出発基地",
    "帰着基地",
    "備考"
  ]
  
  // CSVデータ行
  const rows = plans.map((plan, index) => {
    // データの安全な取得
    const planDate = plan.plan_date || ""
    const vehicleType = plan.vehicle?.vehicle_type || ""
    const machineNumber = plan.vehicle?.machine_number || ""
    const departureBase = plan.departure_base?.base_name || ""
    const arrivalBase = plan.arrival_base?.base_name || ""
    const notes = "" // 備考欄は空欄
    
    console.log(`Plan ${index}:`, {
      planDate,
      vehicleType,
      machineNumber,
      departureBase,
      arrivalBase,
      vehicle: plan.vehicle,
      departure_base: plan.departure_base,
      arrival_base: plan.arrival_base
    })
    
    return [
      planDate,
      vehicleType,
      machineNumber,
      departureBase,
      arrivalBase,
      notes
    ]
  })
  
  console.log("CSV rows:", rows)
  
  // CSV文字列を生成
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
  ].join("\n")
  
  return BOM + csvContent
}
