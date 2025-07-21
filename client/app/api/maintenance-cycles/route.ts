import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from("maintenance_cycles")
      .select("*")
      .eq("is_active", true)
      .order("vehicle_type", { ascending: true })
      .order("cycle_days", { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching maintenance cycles:", error)
    return NextResponse.json({ error: "Failed to fetch maintenance cycles" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { vehicle_type, cycle_type, cycle_days, cycle_distance, maintenance_duration, advance_notice_days } = body

    const { data, error } = await supabase
      .from("maintenance_cycles")
      .insert([
        {
          vehicle_type,
          cycle_type,
          cycle_days,
          cycle_distance,
          maintenance_duration,
          advance_notice_days,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error creating maintenance cycle:", error)
    return NextResponse.json({ error: "Failed to create maintenance cycle" }, { status: 500 })
  }
}
