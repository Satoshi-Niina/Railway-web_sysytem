import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseType, executeQuery } from "@/lib/database"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const vehicleType = searchParams.get("vehicle_type")
  const isActive = searchParams.get("is_active")

  try {
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      let query = `
        SELECT 
          mc.*,
          COUNT(v.id) as vehicle_count
        FROM maintenance_cycles mc
        LEFT JOIN vehicles v ON mc.vehicle_type = v.vehicle_type AND v.status = 'active'
        WHERE 1=1
      `
      
      const params: any[] = []
      let paramIndex = 1
      
      if (vehicleType) {
        query += ` AND mc.vehicle_type = $${paramIndex}`
        params.push(vehicleType)
        paramIndex++
      }
      
      if (isActive !== null) {
        query += ` AND mc.is_active = $${paramIndex}`
        params.push(isActive === 'true')
        paramIndex++
      }
      
      query += ` GROUP BY mc.id ORDER BY mc.vehicle_type, mc.cycle_days`

      const data = await executeQuery(query, params)
      return NextResponse.json(data)
    } else { return NextResponse.json([]) }
  } catch (error: any) {
    console.error("Error fetching maintenance cycles:", error)
    return NextResponse.json({ error: "Failed to fetch maintenance cycles" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vehicle_type, inspection_type, cycle_days, description } = body

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      const result = await executeQuery(
        `INSERT INTO maintenance_cycles (vehicle_type, inspection_type, cycle_days, description)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [vehicle_type, inspection_type, cycle_days, description]
      )
      
      return NextResponse.json(result[0], { status: 201 })
    } else { return NextResponse.json([]) }
  } catch (error: any) {
    console.error("Error creating maintenance cycle:", error)
    return NextResponse.json({ error: "Failed to create maintenance cycle" }, { status: 500 })
  }
}
