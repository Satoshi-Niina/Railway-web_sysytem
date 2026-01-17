import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseType, executeQuery } from "@/lib/database"

// GET: 検査サイクル順序を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleType = searchParams.get("vehicle_type")

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      let query = `
        SELECT * FROM inspections.inspection_cycle_order
        WHERE is_active = true
      `
      const params: any[] = []

      if (vehicleType) {
        query += ` AND vehicle_type = $1`
        params.push(vehicleType)
      }

      query += ` ORDER BY vehicle_type, cycle_order`

      const data = await executeQuery(query, params)
      return NextResponse.json(data)
    } else {
      return NextResponse.json([])
    }
  } catch (error) {
    console.error("Error fetching inspection cycle order:", error)
    return NextResponse.json(
      { error: "Failed to fetch inspection cycle order" },
      { status: 500 }
    )
  }
}

// POST: 検査サイクル順序を追加
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      vehicle_type,
      inspection_type,
      cycle_order,
      cycle_months,
      warning_months,
      description,
    } = body

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      const query = `
        INSERT INTO inspections.inspection_cycle_order (
          vehicle_type,
          inspection_type,
          cycle_order,
          cycle_months,
          warning_months,
          description
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `
      const result = await executeQuery(query, [
        vehicle_type,
        inspection_type,
        cycle_order,
        cycle_months,
        warning_months || 2,
        description,
      ])

      return NextResponse.json(result[0], { status: 201 })
    } else {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error creating inspection cycle order:", error)
    return NextResponse.json(
      { error: "Failed to create inspection cycle order" },
      { status: 500 }
    )
  }
}
