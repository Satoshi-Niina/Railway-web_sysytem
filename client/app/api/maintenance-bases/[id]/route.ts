import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseType, executeQuery, getSupabaseClient } from "@/lib/database"
import type { MaintenanceBase } from "@/types/database"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      const bases = await executeQuery<MaintenanceBase>(
        `SELECT mb.*, mo.office_name, mo.office_code
         FROM maintenance_bases mb
         LEFT JOIN management_offices mo ON mb.management_office_id = mo.id
         WHERE mb.id = $1`,
        [id]
      )
      
      if (bases.length === 0) {
        return NextResponse.json({ error: "Maintenance base not found" }, { status: 404 })
      }
      
      return NextResponse.json(bases[0])
    } else if (dbType === "supabase") {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("maintenance_bases")
        .select(`
          *,
          management_office:management_offices(*)
        `)
        .eq("id", id)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          return NextResponse.json({ error: "Maintenance base not found" }, { status: 404 })
        }
        throw error
      }
      
      return NextResponse.json(data)
    } else {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error fetching maintenance base:", error)
    return NextResponse.json({ error: "Failed to fetch maintenance base" }, { status: 500 })
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
      base_name, 
      base_code, 
      management_office_id,
      location,
      address
    } = body

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      const result = await executeQuery<MaintenanceBase>(
        `UPDATE maintenance_bases SET 
          base_name = $1, base_code = $2, management_office_id = $3, 
          location = $4, address = $5, updated_at = NOW()
         WHERE id = $6 RETURNING *`,
        [
          base_name, base_code, management_office_id, location, address, id
        ],
      )
      
      if (result.length === 0) {
        return NextResponse.json({ error: "Maintenance base not found" }, { status: 404 })
      }
      
      return NextResponse.json(result[0])
    } else if (dbType === "supabase") {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("maintenance_bases")
        .update({ 
          base_name, base_code, management_office_id, location, address, 
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          return NextResponse.json({ error: "Maintenance base not found" }, { status: 404 })
        }
        throw error
      }
      
      return NextResponse.json(data)
    } else {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error updating maintenance base:", error)
    return NextResponse.json({ error: "Failed to update maintenance base" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      const result = await executeQuery<MaintenanceBase>(
        "DELETE FROM maintenance_bases WHERE id = $1 RETURNING *",
        [id]
      )
      
      if (result.length === 0) {
        return NextResponse.json({ error: "Maintenance base not found" }, { status: 404 })
      }
      
      return NextResponse.json({ message: "Maintenance base deleted successfully" })
    } else if (dbType === "supabase") {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from("maintenance_bases")
        .delete()
        .eq("id", id)

      if (error) {
        throw error
      }
      
      return NextResponse.json({ message: "Maintenance base deleted successfully" })
    } else {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error deleting maintenance base:", error)
    return NextResponse.json({ error: "Failed to delete maintenance base" }, { status: 500 })
  }
} 