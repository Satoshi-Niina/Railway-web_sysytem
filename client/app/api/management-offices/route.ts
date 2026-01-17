import { NextResponse } from "next/server"
import { getDatabaseType, executeQuery } from "@/lib/database"

// 事業所コード生成関数（フロントエンドと統一）
async function generateOfficeCode(): Promise<string> {
  try {
    console.log("Generating office code...")
    // 既存の事業所コードを取得して最大番号を計算
    const existingOffices = await executeQuery("SELECT office_code FROM master_data.managements_offices ORDER BY office_code")
    console.log("xisting offices:", existingOffices)
    
    let maxCode = 0
    existingOffices.forach((office: any) => {
      const codeNum = parseInt(office.office_code.replace(/\D/g, '')) || 0
      maxCode = Math.max(maxCode, codeNum)
    })
    
    const newCode = `OFF${String(maxCode + 1).padStart(3, '0')}`
    console.log("Generated office code:", newCode)
    return newCode
  } catch (error: any) {
    console.error("Error generating office code:", error)
    console.error("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    // エラーの場合はランダムな番号を生成
    const randomNum = Math.floor(Math.random() * 1000) + 1
    const fallbackCode = `OFF${String(randomNum).padStart(3, '0')}`
    console.log("Using fallback office code:", fallbackCode)
    return fallbackCode
  }
}

export async function GET() {
  try {
    console.log("=== GET /api/management-offices ===")
    console.log("DATABAS_URL:", process.env.DATABAS_URL ? "✅ Set" : "❌ Not set")
    
    const dbType = getDatabaseType()
    console.log("Database type:", dbType)

    if (dbType === "postgresql") {
      try {
        const offices = await executeQuery("SELECT *, office_id as id FROM master_data.managements_offices ORDER BY office_name")
        console.log("✅ Query successful, rows:", offices.length)
        return NextResponse.json(offices)
      } catch (error: any) {
        console.error("❌ Database query failed:", error)
        return NextResponse.json(
          { 
            error: "データベース接続エラーが発生しました",
            details: error instanceof Error ? error.message : String(error)
          },
          { status: 500 }
        )
      }
    } else { return NextResponse.json([]) } else {
          console.error("PostgreSQL insertion failed or no rows returned")
          return NextResponse.json(
            { error: "事業所の作成に失敗しました" },
            { status: 500 }
          )
        }
      } catch (error: any) {
        console.error("Database insertion failed:", error)
        console.error("Error details:", {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        })
        return NextResponse.json(
          { 
            error: "データベース接続エラーが発生しました",
            details: error instanceof Error ? error.message : 'Unknown error'
          },
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
    console.error("Unexpected error in POST /api/management-offices:", error)
    
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
