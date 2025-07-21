import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from("inspections")
      .select(`
        *,
        vehicle:vehicles(*)
      `)
      .order("inspection_date", { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching inspections:", error)
    return NextResponse.json({ error: "Failed to fetch inspections" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { vehicle_id, inspection_type, inspection_date, pdf_file_url, notes } = body

    const { data, error } = await supabase
      .from("inspections")
      .insert([{ vehicle_id, inspection_type, inspection_date, pdf_file_url, notes }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error creating inspection:", error)
    return NextResponse.json({ error: "Failed to create inspection" }, { status: 500 })
  }
}
