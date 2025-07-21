import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const month = searchParams.get("month")

  try {
    let query = supabase
      .from("travel_records")
      .select(`
        *,
        vehicle:vehicles(*)
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
    console.error("Error fetching travel records:", error)
    return NextResponse.json({ error: "Failed to fetch travel records" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { vehicle_id, record_date, actual_distance } = body

    const { data, error } = await supabase
      .from("travel_records")
      .insert([{ vehicle_id, record_date, actual_distance }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error creating travel record:", error)
    return NextResponse.json({ error: "Failed to create travel record" }, { status: 500 })
  }
}
