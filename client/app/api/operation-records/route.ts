import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const month = searchParams.get("month")

  try {
    let query = supabase
      .from("operation_records")
      .select(`
        *,
        vehicle:vehicles(*),
        departure_base:bases!departure_base_id(*),
        arrival_base:bases!arrival_base_id(*),
        plan:operation_plans(*)
      `)
      .order("record_date", { ascending: true })

    if (month) {
      const startDate = `${month}-01`
      const endDate = `${month}-31`
      query = query.gte("record_date", startDate).lte("record_date", endDate)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching operation records:", error)
    return NextResponse.json({ error: "Failed to fetch operation records" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const {
      plan_id,
      vehicle_id,
      record_date,
      shift_type,
      actual_start_time,
      actual_end_time,
      actual_distance,
      departure_base_id,
      arrival_base_id,
      status,
      notes,
      auto_imported = false,
    } = body

    const { data, error } = await supabase
      .from("operation_records")
      .insert([
        {
          plan_id,
          vehicle_id,
          record_date,
          shift_type,
          actual_start_time,
          actual_end_time,
          actual_distance,
          departure_base_id,
          arrival_base_id,
          status,
          notes,
          auto_imported,
        },
      ])
      .select(`
        *,
        vehicle:vehicles(*),
        departure_base:bases!departure_base_id(*),
        arrival_base:bases!arrival_base_id(*),
        plan:operation_plans(*)
      `)
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error creating operation record:", error)
    return NextResponse.json({ error: "Failed to create operation record" }, { status: 500 })
  }
}
