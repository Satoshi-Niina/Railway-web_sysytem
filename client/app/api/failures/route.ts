import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from("failures")
      .select(`
        *,
        vehicle:vehicles(*),
        repairs(*)
      `)
      .order("failure_date", { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching failures:", error)
    return NextResponse.json({ error: "Failed to fetch failures" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { vehicle_id, failure_date, failure_content, image_urls } = body

    const { data, error } = await supabase
      .from("failures")
      .insert([{ vehicle_id, failure_date, failure_content, image_urls }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error creating failure:", error)
    return NextResponse.json({ error: "Failed to create failure" }, { status: 500 })
  }
}
