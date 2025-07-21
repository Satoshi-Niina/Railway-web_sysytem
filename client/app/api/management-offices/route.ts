import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseType, executeQuery, getSupabaseClient } from "@/lib/database"
import type { ManagementOffice } from "@/types/database"

export async function GET() {
  try {
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      try {
        const offices = await executeQuery<ManagementOffice>("SELECT * FROM management_offices ORDER BY office_name")
        return NextResponse.json(offices)
      } catch (error) {
        console.error("PostgreSQL query failed, falling back to mock data:", error)
        // PostgreSQLが失敗した場合はモックデータにフォールバック
        return getMockOffices()
      }
    } else if (dbType === "supabase") {
      const supabase = getSupabaseClient()
      if (!supabase) {
        return getMockOffices()
      }
      
      try {
        const { data, error } = await supabase.from("management_offices").select("*").order("office_name")
        if (error) throw error
        return NextResponse.json(data)
      } catch (error) {
        console.error("Supabase query failed, falling back to mock data:", error)
        return getMockOffices()
      }
    } else {
      return getMockOffices()
    }
  } catch (error) {
    console.error("Error fetching management offices:", error)
    return getMockOffices()
  }
}

// モック事業所データを取得する関数
function getMockOffices() {
  const mockData: ManagementOffice[] = [
    {
      id: 1,
      office_name: "本社保守事業所",
      office_code: "HQ001",
      station_1: "東京駅",
      station_2: "品川駅",
      station_3: "新宿駅",
      station_4: "渋谷駅",
      station_5: "池袋駅",
      station_6: "上野駅",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: 2,
      office_name: "関西支社保守事業所",
      office_code: "KS001",
      station_1: "大阪駅",
      station_2: "梅田駅",
      station_3: "難波駅",
      station_4: "天王寺駅",
      station_5: "新大阪駅",
      station_6: "京都駅",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ]
  return NextResponse.json(mockData)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      office_name, 
      office_code, 
      station_1,
      station_2,
      station_3,
      station_4,
      station_5,
      station_6
    } = body

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      const result = await executeQuery<ManagementOffice>(
        `INSERT INTO management_offices (
          office_name, office_code, station_1, station_2, station_3, station_4, station_5, station_6
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          office_name, office_code, station_1, station_2, station_3, station_4, station_5, station_6
        ],
      )
      return NextResponse.json(result[0])
    } else if (dbType === "supabase") {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("management_offices")
        .insert({ 
          office_name, office_code, station_1, station_2, station_3, station_4, station_5, station_6
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    } else {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error creating management office:", error)
    return NextResponse.json({ error: "Failed to create management office" }, { status: 500 })
  }
}
