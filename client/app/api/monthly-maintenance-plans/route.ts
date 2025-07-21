import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const month = searchParams.get("month")

  try {
    let query = supabase
      .from("monthly_maintenance_plans")
      .select(`
        *,
        vehicle:vehicles(*),
        base:bases(*)
      `)
      .order("planned_date", { ascending: true })

    if (month) {
      const targetMonth = `${month}-01`
      query = query.eq("target_month", targetMonth)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching monthly maintenance plans:", error)
    return NextResponse.json({ error: "Failed to fetch monthly maintenance plans" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { action, target_month } = body

    if (action === "generate") {
      // ストアドプロシージャを呼び出して検修計画を自動生成
      const { data, error } = await supabase.rpc("generate_monthly_maintenance_plans", {
        target_month_param: target_month,
      })

      if (error) throw error

      return NextResponse.json({ generated_count: data }, { status: 201 })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error generating maintenance plans:", error)
    return NextResponse.json({ error: "Failed to generate maintenance plans" }, { status: 500 })
  }
}
