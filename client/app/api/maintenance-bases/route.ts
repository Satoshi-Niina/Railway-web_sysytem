import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    // モックデータを返す（Supabase設定が未完了の場合）
    const mockBases = [
      {
        id: 1,
        base_name: "本社基地",
        location: "東京",
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: 2,
        base_name: "関西保守基地",
        location: "大阪",
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: 3,
        base_name: "九州基地",
        location: "福岡",
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: 4,
        base_name: "北海道基地",
        location: "札幌",
        created_at: "2024-01-01T00:00:00Z",
      },
    ]

    return NextResponse.json(mockBases)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    const { data: base, error } = await supabase
      .from("maintenance_bases")
      .insert([
        {
          base_name: body.base_name,
          location: body.location,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating maintenance base:", error)
      return NextResponse.json(
        { error: "保守基地の作成に失敗しました" },
        { status: 500 }
      )
    }

    return NextResponse.json(base)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    )
  }
} 