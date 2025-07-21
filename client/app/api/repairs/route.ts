import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { failure_id, repair_date, repair_content, repair_cost, image_urls } = body

    const { data, error } = await supabase
      .from("repairs")
      .insert([{ failure_id, repair_date, repair_content, repair_cost, image_urls }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error creating repair:", error)
    return NextResponse.json({ error: "Failed to create repair" }, { status: 500 })
  }
}
