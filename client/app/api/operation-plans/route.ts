import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const month = searchParams.get("month")

  try {
    let query = supabase
      .from("operation_plans")
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
  } catch (error) {
    console.error("Error fetching operation plans:", error)
    return NextResponse.json({ error: "Failed to fetch operation plans" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const {
      vehicle_id,
      plan_date,
      shift_type,
      start_time,
      end_time,
      planned_distance,
      departure_base_id,
      arrival_base_id,
      notes,
    } = body

    const { data, error } = await supabase
      .from("operation_plans")
      .insert([
        {
          vehicle_id,
          plan_date,
          shift_type,
          start_time,
          end_time,
          planned_distance,
          departure_base_id,
          arrival_base_id,
          notes,
        },
      ])
      .select(`
        *,
        vehicle:vehicles(*),
        departure_base:bases!departure_base_id(*),
        arrival_base:bases!arrival_base_id(*)
      `)
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error creating operation plan:", error)
    return NextResponse.json({ error: "Failed to create operation plan" }, { status: 500 })
  }
}
