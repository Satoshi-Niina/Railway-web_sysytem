import { NextResponse } from "next/server"
import { getDatabaseType, executeQuery } from "@/lib/database"

export async function GET() {
  try {
    console.log("Testing database connection...")
    const dbType = getDatabaseType()
    console.log("Database type:", dbType)

    if (dbType === "postgresql") {
      try {
        // 簡単なクエリを実行して接続をテスト
        const result = await executeQuery("SELECT 1 as test")
        console.log("Database test result:", result)
        
        // テーブルが存在するかチェック
        const tables = await executeQuery(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('management_offices', 'maintenance_bases', 'vehicles')
        `)
        console.log("Available tables:", tables)

        return NextResponse.json({
          status: "success",
          databaseType: dbType,
          connectionTest: result,
          availableTables: tables
        })
      } catch (error) {
        console.error("Database test failed:", error)
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
    console.error("Test endpoint error:", error)
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 