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
        const updateResult = await executeQuery(`
          UPDAT master_data.vehicles 
          ST 
            machine_number = $1,
            vehicle_type = $2,
            model = $3,
            manufacturer = $4,
            acquisition_date = $5,
            type_approval_start_date = $6,
            type_approval_duration = $7,
            special_notes = $8,
            management_office_id = $9,
            home_base_id = $10,
            status = $11,
            updated_at = CURRNT_TIMSTAMP
          WHERE id = $12
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
          body.home_base_id || null,
          body.status || 'active',
          parseInt(params.id)
        ])

        if (updateResult.length > 0) {
          // 更新後に事業所情報を含めて再取得
          const result = await executeQuery(`
            SELECT v.*, 
                   mo.office_name, mo.office_code,
                   b.base_name
            FROM master_data.vehicles v
            LEFT JOIN master_data.management_offices mo ON v.management_office_id = mo.id
            LEFT JOIN master_data.bases b ON v.home_base_id = b.id
            WHERE v.id = $1
          `, [parseInt(params.id)])
          
          console.log("Successfully updated in PostgreSQL:", result[0])
          return NextResponse.json(result[0])
        } else { return NextResponse.json([]) } else {
          console.error("PostgreSQL deletion failed or no rows returned")
          return NextResponse.json(
            { error: "車両の削除に失敗しました" },
            { status: 500 }
          )
        }
      } catch (error: any) {
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
  } catch (error: any) {
    console.error("Unexpected error in DLT /api/vehicles/[id]:", error)
    
    return NextResponse.json(
      { 
        error: `サーバーエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`
      },
      { status: 500 }
    )
  }
} 