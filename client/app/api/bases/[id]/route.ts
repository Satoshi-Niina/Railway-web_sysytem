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
        const updateResult = await executeQuery(`
          UPDAT master_data.bases 
          ST 
            base_name = $1,
            base_type = $2,
            location = $3,
            management_office_id = $4,
            is_active = $5,
            updated_at = CURRNT_TIMSTAMP
          WHERE id = $6
          RETURNING *
        `, [
          body.base_name,
          body.base_type,
          body.location || null,
          body.management_office_id || null,
          body.is_active !== false,
          parseInt(params.id)
        ])

        if (updateResult.length > 0) {
          // 更新後に事業所情報を含めて再取得
          const result = await executeQuery(`
            SELECT b.*, mo.office_name, mo.office_code, mo.responsible_area
            FROM master_data.bases b
            LEFT JOIN master_data.management_offices mo ON b.management_office_id = mo.id
            WHERE b.id = $1
          `, [parseInt(params.id)])
          
          console.log("Successfully updated in PostgreSQL:", result[0])
          return NextResponse.json(result[0])
        } else { return NextResponse.json([]) } else { return NextResponse.json([]) } else { return NextResponse.json([]) } else {
      return NextResponse.json(
        { error: "データベースが設定されていません" },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Unexpected error in DLT /api/bases/[id]:", error)
    
    return NextResponse.json(
      { 
        error: `サーバーエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`
      },
      { status: 500 }
    )
  }
} 