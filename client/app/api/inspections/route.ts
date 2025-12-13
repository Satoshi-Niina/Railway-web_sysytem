import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("=== Inspections API GET called ===")
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get("vehicle_id")
    const month = searchParams.get("month")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    
    console.log("Query params:", { vehicleId, month, startDate, endDate })

    let queryText = `
      SELECT 
        ip.*,
        v.machine_number,
        v.vehicle_type
      FROM inspections.inspection_plans ip
      LEFT JOIN master_data.vehicles v ON ip.vehicle_id = v.id
      WHERE 1=1
    `
    
    const params: any[] = []
    let paramCount = 1

    if (vehicleId) {
      queryText += ` AND ip.vehicle_id = $${paramCount}`
      params.push(vehicleId)
      paramCount++
    }

    // monthパラメータがある場合は月でフィルタ
    if (month) {
      queryText += ` AND DATE_TRUNC('month', ip.planned_start_date) = DATE_TRUNC('month', $${paramCount}::date)`
      params.push(`${month}-01`)
      paramCount++
    } else {
      // monthがない場合はstart_dateとend_dateを使用
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

    console.log("Executing query:", queryText)
    console.log("With params:", params)

    const data = await executeQuery(queryText, params)

    console.log("Query returned:", data?.length || 0, "rows")
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
  try {
    const body = await request.json()

    const queryText = `
      INSERT INTO inspections.inspection_plans (
        vehicle_id, inspection_type, inspection_category, planned_start_date, planned_end_date, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `
    
    const params = [
      body.vehicle_id,
      body.inspection_type,
      body.inspection_category || 'routine',
      body.planned_start_date,
      body.planned_end_date,
      body.status || 'planned',
      body.notes
    ]

    const data = await executeQuery(queryText, params)

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error in inspections API:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    const queryText = `
      UPDATE inspections.inspection_plans
      SET 
        vehicle_id = $1,
        inspection_type = $2,
        inspection_category = $3,
        planned_start_date = $4,
        planned_end_date = $5,
        status = $6,
        notes = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `
    
    const params = [
      updateData.vehicle_id,
      updateData.inspection_type,
      updateData.inspection_category,
      updateData.planned_start_date,
      updateData.planned_end_date,
      updateData.status,
      updateData.notes,
      id
    ]

    const data = await executeQuery(queryText, params)

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error in inspections API:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const queryText = `DELETE FROM inspections.inspection_plans WHERE id = $1 RETURNING *`
    
    await executeQuery(queryText, [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in inspections API:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
