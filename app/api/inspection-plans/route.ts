import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseType, executeQuery, getSupabaseClient } from "@/lib/database"
import type { InspectionPlan } from "@/types/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      let query = `
        SELECT ip.*, 
               v.machine_number, v.vehicle_type, v.model
        FROM inspection_plans ip
        LEFT JOIN vehicles v ON ip.vehicle_id = v.id
      `
      const params: any[] = []

      if (month) {
        query += ` WHERE (
          DATE_TRUNC('month', ip.planned_start_date) = DATE_TRUNC('month', $1::date) OR
          DATE_TRUNC('month', ip.planned_end_date) = DATE_TRUNC('month', $1::date) OR
          (ip.planned_start_date <= $1::date AND ip.planned_end_date >= LAST_DAY($1::date))
        )`
        params.push(`${month}-01`)
      }

      query += " ORDER BY ip.planned_start_date, v.vehicle_type, v.machine_number"

      const plans = await executeQuery<InspectionPlan>(query, params)
      return NextResponse.json(plans)
    } else if (dbType === "supabase") {
      let queryBuilder = getSupabaseClient()
        .from("inspection_plans")
        .select(`
          *,
          vehicle:vehicles(*)
        `)

      if (month) {
        const startDate = `${month}-01`
        const endDate = `${month}-31`
        queryBuilder = queryBuilder.or(
          `planned_start_date.gte.${startDate},planned_end_date.lte.${endDate},and(planned_start_date.lte.${startDate},planned_end_date.gte.${endDate})`,
        )
      }

      const { data, error } = await queryBuilder.order("planned_start_date")

      if (error) throw error
      return NextResponse.json(data)
    } else {
      // モックデータ
      const currentMonth = month || new Date().toISOString().slice(0, 7)
      const mockData: InspectionPlan[] = [
        {
          id: 1,
          vehicle_id: 3,
          inspection_type: "乙A検査",
          inspection_category: "法定検査",
          planned_start_date: `${currentMonth}-20`,
          planned_end_date: `${currentMonth}-22`,
          status: "planned",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          vehicle: {
            id: 3,
            machine_number: "MCR001",
            vehicle_type: "MCR",
            model: "MCR-300",
            manufacturer: "メーカーC",
            acquisition_date: "2019-06-01",
            management_office_id: 2,
            home_base_id: 3,
            status: "active",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        },
      ]
      return NextResponse.json(mockData)
    }
  } catch (error) {
    console.error("Error fetching inspection plans:", error)
    return NextResponse.json({ error: "Failed to fetch inspection plans" }, { status: 500 })
  }
}
