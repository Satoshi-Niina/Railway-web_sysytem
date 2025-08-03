import { NextResponse } from "next/server"
import { getDatabaseType, executeQuery } from "@/lib/database"

// 事業所コード生成関数（フロントエンドと統一）
async function generateOfficeCode(): Promise<string> {
  try {
    console.log("Generating office code...")
    // 既存の事業所コードを取得して最大番号を計算
    const existingOffices = await executeQuery("SELECT office_code FROM management_offices ORDER BY office_code")
    console.log("Existing offices:", existingOffices)
    
    let maxCode = 0
    existingOffices.forEach((office: any) => {
      const codeNum = parseInt(office.office_code.replace(/\D/g, '')) || 0
      maxCode = Math.max(maxCode, codeNum)
    })
    
    const newCode = `OFF${String(maxCode + 1).padStart(3, '0')}`
    console.log("Generated office code:", newCode)
    return newCode
  } catch (error) {
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
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      try {
        const offices = await executeQuery("SELECT * FROM management_offices ORDER BY office_name")
        console.log("PostgreSQL query result:", offices)
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
    console.error("Error fetching management offices:", error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log("POST /api/management-offices called")
    console.log("Request headers:", Object.fromEntries(request.headers.entries()))
    
    const body = await request.json()
    console.log("Request body:", body)
    console.log("Database type:", getDatabaseType())

    // バリデーション
    if (!body.office_name) {
      console.error("Validation failed: missing required fields")
      return NextResponse.json(
        { error: "事業所名は必須です" },
        { status: 400 }
      )
    }

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      try {
        // office_codeを自動生成（フロントエンドと統一）
        const officeCode = body.office_code || await generateOfficeCode()
        console.log("Generated office_code:", officeCode)

        const result = await executeQuery(`
          INSERT INTO management_offices (office_name, office_code, station_1, station_2, station_3, station_4, station_5, station_6)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `, [
          body.office_name, 
          officeCode, 
          body.station_1 || null,
          body.station_2 || null,
          body.station_3 || null,
          body.station_4 || null,
          body.station_5 || null,
          body.station_6 || null
        ])

        if (result.length > 0) {
          console.log("Successfully saved to PostgreSQL:", result[0])
          return NextResponse.json(result[0])
        } else {
          console.error("PostgreSQL insertion failed or no rows returned")
          return NextResponse.json(
            { error: "事業所の作成に失敗しました" },
            { status: 500 }
          )
        }
      } catch (error) {
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
  } catch (error) {
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
