import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase.from("vehicle_types").select("*").order("type_name", { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching vehicle types:", error)
    return NextResponse.json({ error: "Failed to fetch vehicle types" }, { status: 500 })
  }
}
