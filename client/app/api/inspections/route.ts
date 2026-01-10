import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get("vehicle_id")
    const month = searchParams.get("month")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    
    let queryText = `
      SELECT 
        ip.*,
        m.machine_number,
        mt.type_name as vehicle_type
      FROM inspections.inspection_plans ip
      LEFT JOIN master_data.machines m ON ip.vehicle_id::text = m.id::text
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id::text = mt.id::text
      WHERE 1=1
    `
    
    const params: any[] = []
    let paramCount = 1

    if (vehicleId) {
      queryText += ` AND ip.vehicle_id = $${paramCount}`
      params.push(vehicleId)
      paramCount++
    }

    if (month) {
      queryText += ` AND DATE_TRUNC('month', ip.planned_start_date) = DATE_TRUNC('month', $${paramCount}::date)`
      params.push(`${month}-01`)
      paramCount++
    } else {
      if (startDate) {
        queryText += ` AND ip.planned_start_date >= $${paramCount}`
        params.push(startDate)
        paramCount++
      }
      if (endDate) {
        queryText += ` AND ip.planned_start_date <= $${paramCount}`
        params.push(endDate)
        paramCount++
      }
    }

    queryText += ` ORDER BY ip.planned_start_date ASC`

    let data;
    try {
      data = await executeQuery(queryText, params)
    } catch (e: any) {
      if (e.message && (e.message.includes('does not exist') || e.message.includes('存在しません'))) {
        console.warn("Table inspections.inspection_plans does not exist, returning empty array")
        return NextResponse.json([])
      }
      throw e;
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in inspections API:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 })
}
