import { NextResponse } from "next/server"
import { getDatabaseType, executeQuery } from "@/lib/database"

export async function GET() {
  try {
    console.log("Checking vehicles table structure...")
    const dbType = getDatabaseType()
    console.log("Database type:", dbType)

    if (dbType === "postgresql") {
      try {
        // テーブルの構造を確認
        const columns = await executeQuery(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'vehicles' 
          AND table_schema = 'public'
          ORDER BY ordinal_position
        `)
        console.log("Table columns:", columns)

        // サンプルデータも確認
        const sampleData = await executeQuery("SELECT * FROM vehicles LIMIT 1")
        console.log("Sample data:", sampleData)

        return NextResponse.json({
          status: "success",
          databaseType: dbType,
          tableColumns: columns,
          sampleData: sampleData
        })
      } catch (error) {
        console.error("Table structure check failed:", error)
        return NextResponse.json({
          status: "error",
          databaseType: dbType,
          error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
      }
    } else {
      return NextResponse.json({
        status: "error",
        databaseType: dbType,
        error: "Database not configured"
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Check table structure error:", error)
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 