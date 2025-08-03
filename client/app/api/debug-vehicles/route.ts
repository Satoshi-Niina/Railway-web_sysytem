import { NextResponse } from "next/server"
import { getDatabaseType, executeQuery } from "@/lib/database"

export async function GET() {
  try {
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      try {
        // 最新の車両データを取得
        const vehicles = await executeQuery(`
          SELECT v.*, 
               mo.office_name, mo.office_code,
               b.base_name
          FROM vehicles v
          LEFT JOIN management_offices mo ON v.management_office_id = mo.id
          LEFT JOIN bases b ON v.home_base_id = b.id
          WHERE v.status = 'active'
          ORDER BY v.created_at DESC
          LIMIT 5
        `)
        
        // 管理事業所一覧も取得
        const offices = await executeQuery(`
          SELECT * FROM management_offices ORDER BY office_name
        `)
        
        return NextResponse.json({
          latest_vehicles: vehicles,
          management_offices: offices,
          database_type: dbType
        })
      } catch (error) {
        console.error("Database query failed:", error)
        return NextResponse.json(
          { error: "データベース接続エラーが発生しました", details: error },
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
    console.error("Error in debug API:", error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    )
  }
} 