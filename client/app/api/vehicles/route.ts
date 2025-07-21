import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, isSupabaseAvailable } from "@/lib/supabase"

export async function GET() {
  // Supabaseが利用できない場合はモックデータを返す
  if (!isSupabaseAvailable()) {
    console.warn("Supabase not available, returning mock data")
    const mockVehicles = [
      {
        id: 1,
        name: "モータカー",
        model: "MC-100",
        base_location: "東京基地",
        machine_number: "M001",
        manufacturer: "A社",
        acquisition_date: "2020-04-01",
        management_office: "東京事業所",
        type_approval_number: "TA001",
        type_approval_expiration_date: "2025-03-31",
        type_approval_conditions: "高速走行時要点検",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z"
      },
      {
        id: 2,
        name: "鉄トロ",
        model: "TT-200",
        base_location: "大阪基地",
        machine_number: "M002",
        manufacturer: "B社",
        acquisition_date: "2021-07-10",
        management_office: "大阪事業所",
        type_approval_number: "TA002",
        type_approval_expiration_date: "2026-06-30",
        type_approval_conditions: "積載量制限あり",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z"
      }
    ]
    return NextResponse.json(mockVehicles)
  }

  try {
    const supabase = createServerClient()
    if (!supabase) {
      console.warn("Supabase client is null, returning mock data")
      const mockVehicles = [
        {
          id: 1,
          name: "モータカー",
          model: "MC-100",
          base_location: "東京基地",
          machine_number: "M001",
          manufacturer: "A社",
          acquisition_date: "2020-04-01",
          management_office: "東京事業所",
          type_approval_number: "TA001",
          type_approval_expiration_date: "2025-03-31",
          type_approval_conditions: "高速走行時要点検",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z"
        },
        {
          id: 2,
          name: "鉄トロ",
          model: "TT-200",
          base_location: "大阪基地",
          machine_number: "M002",
          manufacturer: "B社",
          acquisition_date: "2021-07-10",
          management_office: "大阪事業所",
          type_approval_number: "TA002",
          type_approval_expiration_date: "2026-06-30",
          type_approval_conditions: "積載量制限あり",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z"
        }
      ]
      return NextResponse.json(mockVehicles)
    }

    const { data, error } = await supabase.from("vehicles").select("*").order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching vehicles:", error)
    return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Supabaseが利用できない場合はモックレスポンスを返す
  if (!isSupabaseAvailable()) {
    console.warn("Supabase not available, returning mock response")
    try {
      const body = await request.json()
      const mockVehicle = {
        id: Date.now(),
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      return NextResponse.json(mockVehicle, { status: 201 })
    } catch (error) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }
  }

  try {
    const supabase = createServerClient()
    if (!supabase) {
      console.warn("Supabase client is null, returning mock response")
      try {
        const body = await request.json()
        const mockVehicle = {
          id: Date.now(),
          ...body,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        return NextResponse.json(mockVehicle, { status: 201 })
      } catch (error) {
        return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
      }
    }

    const body = await request.json()
    const {
      name, // 機種
      model,
      base_location,
      machine_number, // 機械番号
      manufacturer,
      acquisition_date,
      management_office,
      type_approval_number,
      type_approval_expiration_date,
      type_approval_conditions,
    } = body

    // 必須フィールドのバリデーション
    if (!name || !model || !base_location) {
      return NextResponse.json(
        { error: "必須フィールドが不足しています: name, model, base_location" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("vehicles")
      .insert([
        {
          name,
          model,
          base_location,
          machine_number,
          manufacturer,
          acquisition_date: acquisition_date || null,
          management_office,
          type_approval_number,
          type_approval_expiration_date: type_approval_expiration_date || null,
          type_approval_conditions,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: `データベースエラー: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error creating vehicle:", error)
    return NextResponse.json(
      { error: `サーバーエラー: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    )
  }
}
