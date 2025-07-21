import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import type { InspectionPlan } from "@/types" // 更新された型定義をインポート

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const month = searchParams.get("month")

  try {
    let query = supabase
      .from("inspection_plans")
      .select(
        `
        *,
        vehicle:vehicles(*)
      `,
      )
      .order("planned_start_date", { ascending: true })

    if (month) {
      const startDate = `${month}-01`
      const endDate = `${month}-31`
      query = query.or(`planned_start_date.gte.${startDate},planned_end_date.lte.${endDate}`)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching inspection plans:", error)
    return NextResponse.json({ error: "Failed to fetch inspection plans" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const {
      vehicle_id,
      inspection_type, // 新しい詳細な検査種別
      planned_start_date,
      planned_end_date,
      estimated_duration,
      status = "planned", // デフォルト値を設定
      notes,
    } = body

    // inspection_type から inspection_category を導出
    let inspection_category: InspectionPlan["inspection_category"]
    switch (inspection_type) {
      case "臨時修繕":
        inspection_category = "臨修"
        break
      case "定期点検":
        inspection_category = "定検"
        break
      case "乙A検査":
      case "乙B検査":
        inspection_category = "乙検"
        break
      case "甲A検査":
      case "甲B検査":
        inspection_category = "甲検"
        break
      default:
        inspection_category = "その他"
    }

    const { data, error } = await supabase
      .from("inspection_plans")
      .insert([
        {
          vehicle_id,
          inspection_type,
          planned_start_date,
          planned_end_date,
          estimated_duration,
          inspection_category, // 導出したカテゴリを使用
          status,
          notes,
        },
      ])
      .select(
        `
        *,
        vehicle:vehicles(*)
      `,
      )
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error creating inspection plan:", error)
    return NextResponse.json({ error: "Failed to create inspection plan" }, { status: 500 })
  }
}
