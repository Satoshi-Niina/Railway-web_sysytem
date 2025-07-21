import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase.from("bases").select("*").order("base_name", { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching bases:", error)
    return NextResponse.json({ error: "Failed to fetch bases" }, { status: 500 })
  }
}
