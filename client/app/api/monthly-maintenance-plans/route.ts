import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseType, executeQuery } from "@/lib/database"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const month = searchParams.get("month")

  try {
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      let query = `
        SELECT 
          mmp.*,
          v.machine_number,
          v.vehicle_type,
          v.manufacturer,
          mo.office_name,
          mo.office_code
        FROM maintenance.monthly_maintenance_plans mmp
        JOIN master_data.vehicles v ON mmp.vehicle_id = v.id
        LEFT JOIN master_data.managements_offices mo ON v.management_office_id = mo.id
        WHERE v.status = 'active'
      `
      
      const params: any[] = []
      
      if (month) {
        query += ` AND TO_CHAR(mmp.plan_month, 'YYYY-MM') = $1`
        params.push(month)
      }
      
      query += ` ORDER BY mmp.planned_date, v.vehicle_type, v.machine_number`

      const data = await executeQuery(query, params)
      return NextResponse.json(data)
    } else {
      // モチE��チE�Eタ�E�データベ�Eスが設定されてぁE��ぁE��合！E      const mockData = month ? [
        {
          id: 1,
          vehicle_id: 1,
          plan_month: month,
          inspection_type: "乙B検査",
          planned_date: `${month}-15`,
          status: "planned",
          notes: "検修周期に基づく�E動生戁E M001の乙B検査",
          machine_number: "M001",
          vehicle_type: "モータカー",
          manufacturer: "メーカーA",
          office_name: "本社保守事業所",
          office_code: "HQ001",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z"
        },
        {
          id: 2,
          vehicle_id: 2,
          plan_month: month,
          inspection_type: "定椁E,
          planned_date: `${month}-20`,
          status: "planned",
          notes: "検修周期に基づく�E動生戁E M002の定椁E,
          machine_number: "M002",
          vehicle_type: "モータカー",
          manufacturer: "メーカーA",
          office_name: "本社保守事業所",
          office_code: "HQ001",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z"
        }
      ] : []
      
      return NextResponse.json(mockData)
    }
  } catch (error) {
    console.error("Error fetching monthly maintenance plans:", error)
    return NextResponse.json({ error: "Failed to fetch monthly maintenance plans" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, target_month } = body

    if (action === "generate") {
      const dbType = getDatabaseType()

      if (dbType === "postgresql") {
        // PostgreSQLの関数を呼び出して検修計画を�E動生戁E        const result = await executeQuery(
          "SELECT generate_monthly_maintenance_plans($1) as generated_count",
          [target_month]
        )
        
        const generatedCount = result[0]?.generated_count || 0
        return NextResponse.json({ generated_count: generatedCount }, { status: 201 })
      } else {
        // モチE��チE�Eタ生�E
        return NextResponse.json({ generated_count: 2 }, { status: 201 })
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error generating maintenance plans:", error)
    return NextResponse.json({ error: "Failed to generate maintenance plans" }, { status: 500 })
  }
}
