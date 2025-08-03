import { NextResponse } from "next/server"
import { getDatabaseType, executeQuery, getSupabaseClient } from "@/lib/database"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`PUT /api/bases/${params.id} called`)
    
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
          UPDATE bases 
          SET 
            base_name = $1,
            base_type = $2,
            location = $3,
            management_office_id = $4,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
          RETURNING *
        `, [
          body.base_name,
          body.base_type,
          body.location || null,
          body.management_office_id || null,
          parseInt(params.id)
        ])

        if (result.length > 0) {
          console.log("Successfully updated in PostgreSQL:", result[0])
          return NextResponse.json(result[0])
        } else {
          console.error("PostgreSQL update failed or no rows returned")
          return NextResponse.json(
            { error: "基地の更新に失敗しました" },
            { status: 500 }
          )
        }
      } catch (error) {
        console.error("Database update failed:", error)
        return NextResponse.json(
          { error: "データベース接続エラーが発生しました" },
          { status: 500 }
        )
      }
    } else if (dbType === "supabase") {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("bases")
        .update({
          base_name: body.base_name,
          base_type: body.base_type,
          location: body.location,
          management_office_id: body.management_office_id
        })
        .eq("id", parseInt(params.id))
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
    console.error("Unexpected error in PUT /api/bases/[id]:", error)
    
    return NextResponse.json(
      { 
        error: `サーバーエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`DELETE /api/bases/${params.id} called`)

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      try {
        const result = await executeQuery(`
          UPDATE bases 
          SET is_active = false, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `, [parseInt(params.id)])

        if (result.length > 0) {
          console.log("Successfully deleted from PostgreSQL:", result[0])
          return NextResponse.json({ message: "基地を削除しました" })
        } else {
          console.error("PostgreSQL deletion failed or no rows returned")
          return NextResponse.json(
            { error: "基地の削除に失敗しました" },
            { status: 500 }
          )
        }
      } catch (error) {
        console.error("Database deletion failed:", error)
        return NextResponse.json(
          { error: "データベース接続エラーが発生しました" },
          { status: 500 }
        )
      }
    } else if (dbType === "supabase") {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from("bases")
        .update({ is_active: false })
        .eq("id", parseInt(params.id))

      if (error) throw error
      return NextResponse.json({ message: "基地を削除しました" })
    } else {
      return NextResponse.json(
        { error: "データベースが設定されていません" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Unexpected error in DELETE /api/bases/[id]:", error)
    
    return NextResponse.json(
      { 
        error: `サーバーエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`
      },
      { status: 500 }
    )
  }
} 