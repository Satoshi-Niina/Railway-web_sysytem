import { NextResponse } from "next/server"
import { getDatabaseType, executeQuery, getSupabaseClient } from "@/lib/database"
import type { Base } from "@/types/database"

export async function GET() {
  try {
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      const bases = await executeQuery<Base>(
        `SELECT b.*, mo.office_name, mo.office_code, mo.responsible_area
         FROM bases b
         LEFT JOIN management_offices mo ON b.management_office_id = mo.id
         WHERE b.is_active = true
         ORDER BY b.base_name`,
      )
      return NextResponse.json(bases)
    } else if (dbType === "supabase") {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("bases")
        .select(`
          *,
          management_office:management_offices(*)
        `)
        .eq("is_active", true)
        .order("base_name")

      if (error) throw error
      return NextResponse.json(data)
    } else {
      // モックデータ
      const mockData: Base[] = [
        {
          id: 1,
          base_name: "本社保守基地",
          base_type: "maintenance",
          location: "東京",
          management_office_id: 1,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          base_name: "品川保守基地",
          base_type: "maintenance",
          location: "東京",
          management_office_id: 1,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 3,
          base_name: "関西保守基地",
          base_type: "maintenance",
          location: "大阪",
          management_office_id: 2,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ]
      return NextResponse.json(mockData)
    }
  } catch (error) {
    console.error("Error fetching bases:", error)
    return NextResponse.json({ error: "Failed to fetch bases" }, { status: 500 })
  }
}
