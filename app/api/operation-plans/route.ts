import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseType, executeQuery, getSupabaseClient } from "@/lib/database"
import type { OperationPlan } from "@/types/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")

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

      if (month) {
        query += " WHERE DATE_TRUNC('month', op.plan_date) = DATE_TRUNC('month', $1::date)"
        params.push(`${month}-01`)
      }

      query += " ORDER BY op.plan_date, v.vehicle_type, v.machine_number"

      const plans = await executeQuery<OperationPlan>(query, params)
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

      const { data, error } = await queryBuilder.order("plan_date")

      if (error) throw error
      return NextResponse.json(data)
    } else {
      // モックデータ
      const currentMonth = month || new Date().toISOString().slice(0, 7)
      const mockData: OperationPlan[] = [
        {
          id: 1,
          vehicle_id: 1,
          plan_date: `${currentMonth}-15`,
          shift_type: "day",
          departure_base_id: 1,
          arrival_base_id: 1,
          planned_distance: 50,
          start_time: "08:00",
          end_time: "17:00",
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
          },
        },
        {
          id: 2,
          vehicle_id: 2,
          plan_date: `${currentMonth}-16`,
          shift_type: "night",
          departure_base_id: 1,
          arrival_base_id: 1,
          planned_distance: 30,
          start_time: "22:00",
          end_time: "06:00",
          status: "planned",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          vehicle: {
            id: 2,
            machine_number: "M002",
            vehicle_type: "モータカー",
            model: "MC-100",
            manufacturer: "メーカーA",
            acquisition_date: "2020-05-01",
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
          },
        },
      ]
      return NextResponse.json(mockData)
    }
  } catch (error) {
    console.error("Error fetching operation plans:", error)
    return NextResponse.json({ error: "Failed to fetch operation plans" }, { status: 500 })
  }
}
