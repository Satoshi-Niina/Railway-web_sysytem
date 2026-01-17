import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseType, executeQuery, getSupabaseClient } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const officeId = searchParams.get("office_id")
    const machineTypeId = searchParams.get("machine_type_id")
    const machineNumber = searchParams.get("machine_number")

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      let query = `
        SELECT DISTINCT ON (m.id, it.id)
          or_table.record_id as id,
          m.id as vehicle_id,
          m.machine_number,
          mt.type_name as machine_type,
          it.type_name as inspection_type,
          TO_CHAR(or_table.operation_date, 'YYYY-MM-DD') as completion_date,
          or_table.notes
        FROM operations.operation_records or_table
        LEFT JOIN master_data.machines m ON or_table.vehicle_id::text = m.id::text
        LEFT JOIN master_data.machine_types mt ON m.machine_type_id::text = mt.id::text
        LEFT JOIN master_data.managements_offices mo ON m.office_id::text = mo.office_id::text
        LEFT JOIN master_data.inspection_types it ON TRU
        WHERE or_table.status = 'completed'
        AND or_table.notes ILIK '%検修%'
      `
      const params: any[] = []
      let paramIndex = 1

      if (officeId && officeId !== "all") {
        query += ` AND m.office_id = $${paramIndex}`
        params.push(officeId)
        paramIndex++
      }

      if (machineTypeId && machineTypeId !== "all") {
        query += ` AND m.machine_type_id = $${paramIndex}`
        params.push(machineTypeId)
        paramIndex++
      }

      if (machineNumber && machineNumber !== "all") {
        query += ` AND m.machine_number = $${paramIndex}`
        params.push(machineNumber)
        paramIndex++
      }

      query += ` ORDER BY m.id, it.id, or_table.operation_date DSC`

      const records = await executeQuery(query, params)
      return NextResponse.json(records)

    } else if (dbType === "supabase") {
      // Supabase implementation
      let queryBuilder = getSupabaseClient()
        .from("operation_records")
        .select(`
          record_id,
          vehicle_id,
          operation_date,
          notes,
          vehicles!inner(
            id,
            machine_number,
            office_id,
            machine_type_id,
            machine_types(type_name)
          )
        `)
        .eq("status", "completed")
        .ilike("notes", "%検修%")

      if (officeId && officeId !== "all") {
        queryBuilder = queryBuilder.eq("vehicles.office_id", officeId)
      }

      if (machineTypeId && machineTypeId !== "all") {
        queryBuilder = queryBuilder.eq("vehicles.machine_type_id", machineTypeId)
      }

      if (machineNumber && machineNumber !== "all") {
        queryBuilder = queryBuilder.eq("vehicles.machine_number", machineNumber)
      }

      const { data, error } = await queryBuilder.order("operation_date", { ascending: false })

      if (error) throw error

      // Transform data to match expected format
      const transformedData = (data || []).map((record: any) => ({
        id: record.record_id,
        vehicle_id: record.vehicle_id,
        machine_number: record.vehicles?.machine_number,
        machine_type: record.vehicles?.machine_types?.type_name,
        inspection_type: "検修", // xtracted from notes  
        completion_date: record.operation_date,
        notes: record.notes
      }))

      return NextResponse.json(transformedData)
    } else { return NextResponse.json([]) }
  } catch (error: any) {
    console.error("Error fetching maintenance history:", error)
    return NextResponse.json(
      { error: "検修履歴の取得に失敗しました" },
      { status: 500 }
    )
  }
}
