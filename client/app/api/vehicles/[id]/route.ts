import { NextResponse } from "next/server"
import { getDatabaseType, executeQuery } from "@/lib/database"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`PUT /api/vehicles/${params.id} called`)
    
    const body = await request.json()
    console.log("Request body:", body)

    // バリデーション
    if (!body.machine_number || !body.vehicle_type) {
      console.error("Validation failed: missing required fields")
      return NextResponse.json(
        { error: "機械番号と車両タイプは必須です" },
        { status: 400 }
      )
    }

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      try {
        const result = await executeQuery(`
          UPDATE vehicles 
          SET 
            machine_number = $1,
            vehicle_type = $2,
            model = $3,
            manufacturer = $4,
            acquisition_date = $5,
            type_approval_start_date = $6,
            type_approval_duration = $7,
            special_notes = $8,
            management_office_id = $9,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $10
          RETURNING *
        `, [
          body.machine_number,
          body.vehicle_type,
          body.model || null,
          body.manufacturer || null,
          body.acquisition_date || null,
          body.type_approval_start_date || null,
          body.type_approval_duration || null,
          body.special_notes || null,
          body.management_office_id || null,
          parseInt(params.id)
        ])

        if (result.length > 0) {
          console.log("Successfully updated in PostgreSQL:", result[0])
          return NextResponse.json(result[0])
        } else {
          console.error("PostgreSQL update failed or no rows returned")
          return NextResponse.json(
            { error: "車両の更新に失敗しました" },
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
    } else {
      return NextResponse.json(
        { error: "データベースが設定されていません" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Unexpected error in PUT /api/vehicles/[id]:", error)
    
    // エラーの詳細をログに出力
    if (error instanceof Error) {
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    
    return NextResponse.json(
      { 
        error: `サーバーエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
        details: error instanceof Error ? error.stack : 'No stack trace available'
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
    console.log(`DELETE /api/vehicles/${params.id} called`)

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      try {
        const result = await executeQuery(`
          UPDATE vehicles 
          SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `, [parseInt(params.id)])

        if (result.length > 0) {
          console.log("Successfully deleted from PostgreSQL:", result[0])
          return NextResponse.json({ message: "車両を削除しました" })
        } else {
          console.error("PostgreSQL deletion failed or no rows returned")
          return NextResponse.json(
            { error: "車両の削除に失敗しました" },
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
    } else {
      return NextResponse.json(
        { error: "データベースが設定されていません" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Unexpected error in DELETE /api/vehicles/[id]:", error)
    
    return NextResponse.json(
      { 
        error: `サーバーエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`
      },
      { status: 500 }
    )
  }
} 