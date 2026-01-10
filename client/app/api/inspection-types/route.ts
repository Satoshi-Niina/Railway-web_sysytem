import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function GET() {
  try {
    console.log("=== Inspection Types API GET called ===")
    
    const queryText = `
      SELECT
        type_id as id,
        type_name,
        'routine' as category,
        0 as interval_days,
        description,
        created_at
      FROM master_data.inspection_types
      ORDER BY type_name
    `
    
    const result = await executeQuery(queryText, [])
    
    console.log("Inspection types fetched:", result.length)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching inspection types:", error)
    return NextResponse.json(
      { error: "検修タイプの取得に失敗しました" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== Inspection Types API POST called ===")
    const body = await request.json()
    const { type_name, category, interval_days, description } = body
    
    if (!type_name || !category || interval_days === undefined) {
      return NextResponse.json(
        { error: "必須フィールドが不足しています" },
        { status: 400 }
      )
    }
    
    const queryText = `
      INSERT INTO master_data.inspection_types 
        (type_name, category, interval_days, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `
    
    const result = await executeQuery(queryText, [
      type_name,
      category,
      interval_days,
      description || null
    ])
    
    console.log("Inspection type created:", result[0])
    
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating inspection type:", error)
    return NextResponse.json(
      { error: "検修タイプの作成に失敗しました" },
      { status: 500 }
    )
  }
}
