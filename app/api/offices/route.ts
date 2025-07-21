import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase.from("offices").select("*").order("office_name", { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching offices:", error)
    return NextResponse.json({ error: "Failed to fetch offices" }, { status: 500 })
  }
}
