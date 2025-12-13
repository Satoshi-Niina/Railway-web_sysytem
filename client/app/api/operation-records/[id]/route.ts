import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseType, executeQuery, getSupabaseClient } from "@/lib/database"

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      const query = `
        SELECT or_table.*, 
               v.machine_number, v.vehicle_type, v.model,
               mo.office_name, mo.office_code,
               db.base_name as departure_base_name,
               ab.base_name as arrival_base_name
        FROM operations.operation_records or_table
        LEFT JOIN master_data.vehicles v ON or_table.vehicle_id = v.id
        LEFT JOIN master_data.management_offices mo ON v.management_office_id = mo.id
        LEFT JOIN master_data.bases db ON or_table.departure_base_id = db.id
        LEFT JOIN master_data.bases ab ON or_table.arrival_base_id = ab.id
        WHERE or_table.id = $1
      `
      const result = await executeQuery(query, [id])
      
      if (result.length === 0) {
        return NextResponse.json({ error: "Record not found" }, { status: 404 })
      }
      
      return NextResponse.json(result[0])
    } else if (dbType === "supabase") {
      const { data, error } = await getSupabaseClient()
        .from("operation_records")
        .select(`
          *,
          vehicle:vehicles(*),
          management_office:vehicles!inner(management_office:management_offices(*)),
          departure_base:bases!departure_base_id(*),
          arrival_base:bases!arrival_base_id(*)
        `)
        .eq("id", id)
        .single()

      if (error) throw error
      return NextResponse.json(data)
    } else {
      // モックデータ
      return NextResponse.json({
        id: Number.parseInt(id),
        vehicle_id: 1,
        record_date: "2024-01-15",
        shift_type: "day",
        start_time: "08:00",
        end_time: "17:00",
        actual_distance: 120,
        departure_base_id: 1,
        arrival_base_id: 1,
        status: "completed",
        notes: "",
      })
    }
  } catch (error) {
    console.error("Error fetching operation record:", error)
    return NextResponse.json(
      { error: "Failed to fetch operation record", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const {
      vehicle_id,
      record_date,
      shift_type,
      start_time,
      end_time,
      actual_distance,
      departure_base_id,
      arrival_base_id,
      status,
      notes,
    } = body

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      const query = `
        UPDATE operations.operation_records
        SET 
          vehicle_id = $1,
          record_date = $2,
          shift_type = $3,
          start_time = $4,
          end_time = $5,
          actual_distance = $6,
          departure_base_id = $7,
          arrival_base_id = $8,
          status = $9,
          notes = $10,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $11
        RETURNING *
      `
      const params = [
        vehicle_id,
        record_date,
        shift_type,
        start_time,
        end_time,
        actual_distance,
        departure_base_id,
        arrival_base_id,
        status,
        notes,
        id,
      ]

      const result = await executeQuery(query, params)
      
      if (result.length === 0) {
        return NextResponse.json({ error: "Record not found" }, { status: 404 })
      }
      
      return NextResponse.json(result[0])
    } else if (dbType === "supabase") {
      const { data, error } = await getSupabaseClient()
        .from("operation_records")
        .update(body)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    } else {
      // モックデータ
      return NextResponse.json({
        id: Number.parseInt(id),
        ...body,
        updated_at: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("Error updating operation record:", error)
    return NextResponse.json(
      { error: "Failed to update operation record", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      const query = `
        DELETE FROM operations.operation_records
        WHERE id = $1
        RETURNING id
      `
      const result = await executeQuery(query, [id])
      
      if (result.length === 0) {
        return NextResponse.json({ error: "Record not found" }, { status: 404 })
      }
      
      return NextResponse.json({ message: "Record deleted successfully", id: result[0].id })
    } else if (dbType === "supabase") {
      const { error } = await getSupabaseClient()
        .from("operation_records")
        .delete()
        .eq("id", id)

      if (error) throw error
      return NextResponse.json({ message: "Record deleted successfully", id })
    } else {
      // モックデータ
      return NextResponse.json({ message: "Record deleted successfully", id })
    }
  } catch (error) {
    console.error("Error deleting operation record:", error)
    return NextResponse.json(
      { error: "Failed to delete operation record", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
