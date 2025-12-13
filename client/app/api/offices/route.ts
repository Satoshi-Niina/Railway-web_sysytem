import { NextResponse } from "next/server"
import { getDatabaseType, executeQuery } from "@/lib/database"

export async function GET() {
  try {
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      try {
        const offices = await executeQuery(`
          SELECT * FROM master_data.management_offices
          ORDER BY office_name
        `)
        return NextResponse.json(offices)
      } catch (error) {
        console.error("Database query failed:", error)
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
    console.error("Error fetching offices:", error)
    return NextResponse.json(
      { error: "事業所データの取得に失敗しました" },
      { status: 500 }
    )
  }
}
