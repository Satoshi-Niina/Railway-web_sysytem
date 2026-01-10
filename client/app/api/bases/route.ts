import { NextResponse } from "next/server"
import { getDatabaseType, executeQuery, getSupabaseClient } from "@/lib/database"
import type { Base } from "@/types/database"

export async function GET() {
  try {
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      try {
        const bases = await executeQuery(
          `SELECT b.base_id as id, b.base_name, b.base_code, b.location, 
                  b.office_id as management_office_id,
                  b.created_at, b.updated_at,
                  mo.office_name, mo.office_code
           FROM master_data.bases b
           LEFT JOIN master_data.managements_offices mo ON b.office_id::text = mo.office_id::text
           ORDER BY b.base_name`
        )
        return NextResponse.json(bases)
      } catch (error: any) {
        console.error("Database query failed:", error)
        return NextResponse.json(
          { 
            error: "データベース接続エラーが発生しました",
            details: error.message,
            code: error.code
          },
          { status: 500 }
        )
      }
    } else if (dbType === "supabase") {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("bases")
        .select(`
          *,
          management_office:management_offices(*)
        `)
        .eq("is_active", true)
        .order("base_name")

      if (error) throw error
      return NextResponse.json(data)
    } else {
      // モックデータ
      const mockData: Base[] = [
        {
          id: 1,
          base_name: "本社保守基地",
          base_type: "maintenance",
          location: "東京",
          management_office_id: 1,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          base_name: "品川保守基地",
          base_type: "maintenance",
          location: "東京",
          management_office_id: 1,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 3,
          base_name: "関西保守基地",
          base_type: "maintenance",
          location: "大阪",
          management_office_id: 2,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ]
      return NextResponse.json(mockData)
    }
  } catch (error) {
    console.error("Error fetching bases:", error)
    return NextResponse.json({ error: "Failed to fetch bases" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log("POST /api/bases called")
    
    const body = await request.json()
    console.log("Request body:", body)

    // バリデーション
    if (!body.base_name || !body.base_type) {
      console.error("Validation failed: missing required fields")
      return NextResponse.json(
        { error: "基地名と基地タイプは必須です" },
        { status: 400 }
      )
    }

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      try {
        const result = await executeQuery(`
          INSERT INTO master_data.bases (
            base_name, base_type, location, office_id, is_active
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [
          body.base_name,
          body.base_type,
          body.location || null,
          body.management_office_id || body.office_id || null,
          body.is_active !== false // デフォルトはtrue
        ])

        if (result.length > 0) {
          console.log("Successfully saved to PostgreSQL:", result[0])
          return NextResponse.json(result[0])
        } else {
          console.error("PostgreSQL insertion failed or no rows returned")
          return NextResponse.json(
            { error: "基地の作成に失敗しました" },
            { status: 500 }
          )
        }
      } catch (error) {
        console.error("Database insertion failed:", error)
        return NextResponse.json(
          { error: "データベース接続エラーが発生しました" },
          { status: 500 }
        )
      }
    } else if (dbType === "supabase") {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("bases")
        .insert({
          base_name: body.base_name,
          base_type: body.base_type,
          location: body.location,
          management_office_id: body.management_office_id,
          is_active: body.is_active !== false
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    } else {
      return NextResponse.json(
        { error: "データベースが設定されていません" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Unexpected error in POST /api/bases:", error)
    
    return NextResponse.json(
      { 
        error: `サーバーエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`
      },
      { status: 500 }
    )
  }
}
