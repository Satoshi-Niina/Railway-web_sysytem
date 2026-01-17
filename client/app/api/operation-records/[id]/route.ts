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
               or_table.record_id as id,
               or_table.operation_date as record_date,
               v.machine_number, mt.type_name as vehicle_type, mt.model_name as model,
               mo.office_name, mo.office_code,
               db.base_name as departure_base_name,
               ab.base_name as arrival_base_name
        FROM operations.operation_records or_table
        LEFT JOIN master_data.vehicles v ON or_table.vehicle_id = v.id
        LEFT JOIN master_data.management_offices mo ON v.management_office_id = mo.id
        LEFT JOIN master_data.bases db ON or_table.departure_base_id = db.id
        LEFT JOIN master_data.bases ab ON or_table.arrival_base_id = ab.id
        WHERE or_table.record_id = $1
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
    } else { return NextResponse.json([]) }
      
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
    } else { return NextResponse.json([]) }
      
      return NextResponse.json({ message: "Record deleted successfully", id: result[0].id })
    } else if (dbType === "supabase") {
      const { error } = await getSupabaseClient()
        .from("operation_records")
        .delete()
        .eq("id", id)

      if (error) throw error
      return NextResponse.json({ message: "Record deleted successfully", id })
    } else { return NextResponse.json([]) }
  } catch (error: any) {
    console.error("Error deleting operation record:", error)
    return NextResponse.json(
      { error: "Failed to delete operation record", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
