import { NextResponse } from "next/server"
import { getDatabaseType, executeQuery, getSupabaseClient } from "@/lib/database"
import type { Vehicle } from "@/types/database"

export async function GET() {
  try {
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      const vehicles = await executeQuery<Vehicle>(
        `SELECT v.*, 
                mo.office_name, mo.office_code, mo.responsible_area,
                b.base_name, b.base_type, b.location as base_location
         FROM vehicles v
         LEFT JOIN management_offices mo ON v.management_office_id = mo.id
         LEFT JOIN bases b ON v.home_base_id = b.id
         WHERE v.status = 'active'
         ORDER BY v.vehicle_type, v.machine_number`,
      )
      return NextResponse.json(vehicles)
    } else if (dbType === "supabase") {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("vehicles")
        .select(`
          *,
          management_office:management_offices(*),
          home_base:bases(*)
        `)
        .eq("status", "active")
        .order("vehicle_type")
        .order("machine_number")

      if (error) throw error
      return NextResponse.json(data)
    } else {
      // モックデータ
      const mockData: Vehicle[] = [
        {
          id: 1,
          machine_number: "M001",
          vehicle_type: "モータカー",
          model: "MC-100",
          manufacturer: "メーカーA",
          acquisition_date: "2020-04-01",
          management_office_id: 1,
          home_base_id: 1,
          status: "active",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          machine_number: "M002",
          vehicle_type: "モータカー",
          model: "MC-100",
          manufacturer: "メーカーA",
          acquisition_date: "2020-05-01",
          management_office_id: 1,
          home_base_id: 1,
          status: "active",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 3,
          machine_number: "MCR001",
          vehicle_type: "MCR",
          model: "MCR-300",
          manufacturer: "メーカーC",
          acquisition_date: "2019-06-01",
          management_office_id: 2,
          home_base_id: 3,
          status: "active",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 4,
          machine_number: "T001",
          vehicle_type: "鉄トロ（10t）",
          model: "TT-10",
          manufacturer: "メーカーD",
          acquisition_date: "2018-08-01",
          management_office_id: 2,
          home_base_id: 3,
          status: "active",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ]
      return NextResponse.json(mockData)
    }
  } catch (error) {
    console.error("Error fetching vehicles:", error)
    return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 })
  }
}
