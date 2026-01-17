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
    } else { return NextResponse.json([]) }
  } catch (error: any) {
    console.error("Error fetching inspection plans:", error)
    return NextResponse.json({ error: "Failed to fetch inspection plans" }, { status: 500 })
  }
}
