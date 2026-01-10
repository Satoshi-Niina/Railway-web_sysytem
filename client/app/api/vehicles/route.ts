import { NextResponse } from "next/server"
import { getDatabaseType, executeQuery } from "@/lib/database"

// 車両ID生成関数（車両タイプの頭2文字をローマ字に変換）
function generateVehicleId(vehicleType: string): number {
  const typeMap: { [key: string]: string } = {
    'MC-100': 'MC',
    'MC-150': 'MC',
    'TT-200': 'TT',
    'TT-250': 'TT',
    'HP-300': 'HP',
    'HP-350': 'HP'
  }

  const prefix = typeMap[vehicleType] || 'XX'
  const randomNum = Math.floor(Math.random() * 1000) + 1
  return randomNum
}

export async function GET(request: Request) {
  try {
    console.log("=== Vehicles API GET called ===")
    console.log("Request method:", request.method)
    console.log("Request URL:", request.url)
    
    const dbType = getDatabaseType()
    console.log("Database type:", dbType)

    if (dbType === "postgresql") {
      try {
        console.log("Executing vehicles query...")
        const vehicles = await executeQuery(`
          SELECT 
            m.id as id,
            m.machine_number,
            mt.model_name as vehicle_type,
            mt.id as model,
            mt.manufacturer,
            'active' as status,
            mo.office_name,
            mo.office_id as management_office_id,
            m.purchase_date as acquisition_date,
            m.created_at,
            m.updated_at
          FROM master_data.machines m
          LEFT JOIN master_data.machine_types mt ON m.machine_type_id::text = mt.id::text
          LEFT JOIN master_data.managements_offices mo ON m.office_id::text = mo.office_id::text
          ORDER BY mt.model_name, m.machine_number
        `)
        console.log("PostgreSQL query result:", vehicles.length, "vehicles found")
        return NextResponse.json(vehicles)
      } catch (error) {
        console.error("Database query failed:", error)
        console.error("Error message:", error instanceof Error ? error.message : String(error))
        console.error("Error code:", (error as any).code)
        return NextResponse.json(
          { 
            error: "データベース接続エラーが発生しました",
            details: error instanceof Error ? error.message : String(error),
            code: (error as any).code
          },
          { status: 500 }
        )
      }
    } else {
      console.log("Database not configured, returning error")
      return NextResponse.json(
        { error: "データベースが設定されていません", dbType },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error fetching vehicles:", error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log("POST /api/vehicles called")
    
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
        // まず車両を挿入
        const insertResult = await executeQuery(`
          INSERT INTO master_data.vehicles (
            machine_number, vehicle_type, model, manufacturer, acquisition_date, 
            office_id, base_id, status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `, [
          body.machine_number,
          body.vehicle_type,
          body.model || null,
          body.manufacturer || null,
          body.acquisition_date || null,
          body.management_office_id || body.office_id || null,
          body.home_base_id || body.base_id || null,
          'active'
        ])

        if (insertResult.length > 0) {
          // 挿入された車両のIDを取得
          const vehicleId = insertResult[0].id
          
          // 管理事業所情報を含めて取得
          const result = await executeQuery(`
            SELECT v.*, mo.office_name, mo.office_code
            FROM master_data.vehicles v
            LEFT JOIN master_data.managements_offices mo ON v.office_id::text = mo.office_id::text
            WHERE v.vehicle_id::text = $1::text
          `, [vehicleId])
          
          if (result.length > 0) {
            console.log("Successfully saved to PostgreSQL:", result[0])
            return NextResponse.json(result[0])
          } else {
            console.error("Failed to fetch vehicle with office info")
            return NextResponse.json(insertResult[0])
          }
        } else {
          console.error("PostgreSQL insertion failed or no rows returned")
          return NextResponse.json(
            { error: "車両の作成に失敗しました" },
            { status: 500 }
          )
        }
      } catch (error) {
        console.error("Database insertion failed:", error)
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
    console.error("Unexpected error in POST /api/vehicles:", error)
    
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
