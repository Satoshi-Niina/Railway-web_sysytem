import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const month = searchParams.get("month")

  try {
    let query = supabase
      .from("travel_plans")
      .select(`
        *,
        vehicle:vehicles(*),
        departure_base:bases!departure_base_id(*),
        arrival_base:bases!arrival_base_id(*)
      `)
      .order("plan_date", { ascending: true })

    if (month) {
      const startDate = `${month}-01`
      const endDate = `${month}-31`
      query = query.gte("plan_date", startDate).lte("plan_date", endDate)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error fetching travel plans:", error)
    return NextResponse.json({ error: "Failed to fetch travel plans" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { vehicle_id, plan_date, planned_distance, departure_base_id, arrival_base_id } = body

    const { data, error } = await supabase
      .from("travel_plans")
      .insert([{ vehicle_id, plan_date, planned_distance, departure_base_id, arrival_base_id }])
      .select(`
        *,
        vehicle:vehicles(*),
        departure_base:bases!departure_base_id(*),
        arrival_base:bases!arrival_base_id(*)
      `)
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error("Error creating travel plan:", error)
    return NextResponse.json({ error: "Failed to create travel plan" }, { status: 500 })
  }
}
