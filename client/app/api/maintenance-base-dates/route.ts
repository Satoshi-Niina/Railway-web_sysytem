import { NextRequest, NextResponse } from "next/server"
import { getDatabaseType, executeQuery, getSupabaseClient } from "@/lib/database"

// モックデータ
const mockData = [
  {
    id: 1,
    vehicle_id: "v001",
    inspection_type_id: 1,
    base_date: "2025-01-01",
    source: "manual",
    notes: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    machine_number: "M001",
    machine_type: "モータカー",
    inspection_type: "月例検査"
  },
  {
    id: 2,
    vehicle_id: "v001",
    inspection_type_id: 2,
    base_date: "2025-01-01",
    source: "purchase",
    notes: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    machine_number: "M001",
    machine_type: "モータカー",
    inspection_type: "3ヶ月点検"
  },
  {
    id: 3,
    vehicle_id: "v002",
    inspection_type_id: 1,
    base_date: "2025-02-15",
    source: "manual",
    notes: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    machine_number: "M002",
    machine_type: "軌道検測車",
    inspection_type: "月例検査"
  }
]

// GET: 起算日一覧取得
export async function GET(_request: NextRequest) {
  try {
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      try {
        const result = await executeQuery(
          `SELECT 
            mbd.id,
            mbd.vehicle_id,
            mbd.inspection_type_id,
            TO_CHAR(mbd.base_date, 'YYYY-MM-DD') as base_date,
            mbd.source,
            mbd.notes,
            mbd.created_at,
            mbd.updated_at,
            m.machine_number,
            mt.model_name as machine_type,
            it.type_name as inspection_type
          FROM master_data.maintenance_base_dates mbd
          JOIN master_data.machines m ON mbd.vehicle_id::text = m.id::text
          LEFT JOIN master_data.machine_types mt ON m.machine_type_id::text = mt.id::text
          LEFT JOIN master_data.inspection_types it ON mbd.inspection_type_id::text = it.id::text
          ORDER BY m.machine_number, it.type_name`,
          []
        )

        return NextResponse.json(result)
      } catch (dbError) {
        console.error('PostgreSQL query failed, falling back to mock data:', dbError)
        return NextResponse.json(mockData)
      }
    } else if (dbType === "supabase") {
      try {
        const supabase = getSupabaseClient()
        if (!supabase) {
          console.log('Supabase client not available, using mock data')
          return NextResponse.json(mockData)
        }
        
        const { data, error } = await (supabase as any)
          .from("maintenance_base_dates")
          .select(`
            id,
            vehicle_id,
            inspection_type_id,
            base_date,
            source,
            notes,
            created_at,
            updated_at
          `)
          .order("vehicle_id")

        if (error) throw error
        return NextResponse.json(data || [])
      } catch (supabaseError) {
        console.error('Supabase query failed, falling back to mock data:', supabaseError)
        return NextResponse.json(mockData)
      }
    } else {
      // モックモード
      return NextResponse.json(mockData)
    }
  } catch (error: any) {
    console.error('Error fetching maintenance base dates:', error)
    // エラー時もモックデータを返す
    return NextResponse.json(mockData)
  }
}
