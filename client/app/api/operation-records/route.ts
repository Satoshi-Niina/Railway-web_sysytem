import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseType, executeQuery, getSupabaseClient } from "@/lib/database"
import type { OperationRecord } from "@/types/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const officeId = searchParams.get("office_id")
    const vehicleType = searchParams.get("vehicle_type")

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      let query = `
        SELECT or_table.*, 
               or_table.record_id as id,
               TO_CHAR(or_table.operation_date, 'YYYY-MM-DD') as record_date,
               m.machine_number, mt.type_name as vehicle_type, mt.model_name as model,
               mo.office_name, mo.office_code,
               db.base_name as departure_base_name, db.location as departure_location,
               ab.base_name as arrival_base_name, ab.location as arrival_location
        FROM operations.operation_records or_table
        LEFT JOIN master_data.machines m ON or_table.vehicle_id::text = m.id::text
        LEFT JOIN master_data.machine_types mt ON m.machine_type_id::text = mt.id::text
        LEFT JOIN master_data.managements_offices mo ON m.office_id::text = mo.office_id::text
        LEFT JOIN master_data.bases db ON or_table.departure_base_id::text = db.base_id::text
        LEFT JOIN master_data.bases ab ON or_table.arrival_base_id::text = ab.base_id::text
      `
      const params: any[] = []
      let paramIndex = 1
      let whereConditions: string[] = []

      if (month) {
        whereConditions.push(`DATE_TRUNC('month', or_table.operation_date) = DATE_TRUNC('month', $${paramIndex}::date)`)
        params.push(`${month}-01`)
        paramIndex++
      }

      if (officeId && officeId !== "all") {
        whereConditions.push(`m.office_id = $${paramIndex}`)
        params.push(officeId)
        paramIndex++
      }

      if (vehicleType && vehicleType !== "all") {
        whereConditions.push(`mt.type_name = $${paramIndex}`)
        params.push(vehicleType)
        paramIndex++
      }

      if (whereConditions.length > 0) {
        query += " WHERE " + whereConditions.join(" AND ")
      }

      query += " ORDER BY or_table.operation_date, mo.office_name, mt.type_name, m.machine_number"

      const records = await executeQuery<OperationRecord>(query, params)
      return NextResponse.json(records)
    } else if (dbType === "supabase") {
      let queryBuilder = getSupabaseClient()
        .from("operation_records")
        .select(`
          *,
          vehicle:vehicles(*),
          management_office:vehicles!inner(management_office:managements_offices(*)),
          departure_base:bases!departure_base_id(*),
          arrival_base:bases!arrival_base_id(*)
        `)

      if (month) {
        const startDate = `${month}-01`
        const endDate = `${month}-31`
        queryBuilder = queryBuilder.gte("record_date", startDate).lte("record_date", endDate)
      }

      if (officeId && officeId !== "all") {
        queryBuilder = queryBuilder.eq("vehicle.management_office_id", Number.parseInt(officeId))
      }

      if (vehicleType && vehicleType !== "all") {
        queryBuilder = queryBuilder.eq("vehicle.vehicle_type", vehicleType)
      }

      const { data, error } = await queryBuilder.order("record_date")

      if (error) throw error
      return NextResponse.json(data)
    } else {
      // モチE��チE�Eタ
      const currentMonth = month || "2024-01"
      
      // 事業所マスターのモチE��チE�Eタ
      const managementOffices = [
        {
          id: 1,
          office_name: "本社保守事業所",
          office_code: "HQ001",
          station_1: "東京駁E,
          station_2: "品川駁E,
          station_3: "新宿駁E,
          station_4: "渋谷駁E,
          station_5: "池袋駁E,
          station_6: "上野駁E,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          office_name: "関西支社保守事業所",
          office_code: "KS001",
          station_1: "大阪駁E,
          station_2: "梁E��駁E,
          station_3: "難波駁E,
          station_4: "天王寺駁E,
          station_5: "新大阪駁E,
          station_6: "京都駁E,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ]
      
      const mockData: OperationRecord[] = [
        {
          id: 1,
          vehicle_id: 1,
          record_date: `${currentMonth}-15`,
          shift_type: "day",
          departure_base_id: 1,
          arrival_base_id: 1,
          actual_distance: 48,
          actual_start_time: "08:15",
          actual_end_time: "16:45",
          status: "completed",
          auto_imported: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          // 事業所惁E��を追加
          office_name: managementOffices[0].office_name,
          office_code: managementOffices[0].office_code,
          station_1: managementOffices[0].station_1,
          station_2: managementOffices[0].station_2,
          station_3: managementOffices[0].station_3,
          station_4: managementOffices[0].station_4,
          station_5: managementOffices[0].station_5,
          station_6: managementOffices[0].station_6,
          vehicle: {
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
          departure_base: {
            id: 1,
            base_name: "本社保守基地",
            base_type: "maintenance",
            location: "東京",
            management_office_id: 1,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
          arrival_base: {
            id: 1,
            base_name: "本社保守基地",
            base_type: "maintenance",
            location: "東京",
            management_office_id: 1,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        },
        {
          id: 2,
          vehicle_id: 4,
          record_date: `${currentMonth}-16`,
          shift_type: "night",
          departure_base_id: 2,
          arrival_base_id: 2,
          actual_distance: 35,
          actual_start_time: "22:30",
          actual_end_time: "06:15",
          status: "completed",
          auto_imported: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          // 事業所惁E��を追加
          office_name: managementOffices[1].office_name,
          office_code: managementOffices[1].office_code,
          station_1: managementOffices[1].station_1,
          station_2: managementOffices[1].station_2,
          station_3: managementOffices[1].station_3,
          station_4: managementOffices[1].station_4,
          station_5: managementOffices[1].station_5,
          station_6: managementOffices[1].station_6,
          vehicle: {
            id: 4,
            machine_number: "M004",
            vehicle_type: "鉁E��ロ�E�E5t�E�E,
            model: "TT-15",
            manufacturer: "メーカーB",
            acquisition_date: "2019-08-01",
            management_office_id: 2,
            home_base_id: 2,
            status: "active",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
          departure_base: {
            id: 2,
            base_name: "関西保守基地",
            base_type: "maintenance",
            location: "大阪",
            management_office_id: 2,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
          arrival_base: {
            id: 2,
            base_name: "関西保守基地",
            base_type: "maintenance",
            location: "大阪",
            management_office_id: 2,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        },
      ]
      
      // フィルターを適用
      let filteredData = mockData
      
      if (officeId && officeId !== "all") {
        filteredData = filteredData.filter(record => 
          record.vehicle?.management_office_id === Number.parseInt(officeId)
        )
      }
      
      if (vehicleType && vehicleType !== "all") {
        filteredData = filteredData.filter(record => 
          record.vehicle?.vehicle_type === vehicleType
        )
      }
      
      return NextResponse.json(filteredData)
    }
  } catch (error) {
    console.error("Error fetching operation records:", error)
    return NextResponse.json({ error: "Failed to fetch operation records" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      vehicle_id,
      record_date,
      shift_type,
      actual_start_time,
      start_time, // 互換性のため
      actual_end_time,
      end_time,   // 互換性のため
      actual_distance,
      departure_base_id,
      arrival_base_id,
      status,
      notes,
    } = body

    // フロントエンドから�Eパラメータを適刁E��マッピング
    const startTime = actual_start_time || start_time
    const endTime = actual_end_time || end_time
    
    // 日付を YYYY-MM-DD 形式に正規化�E�タイムゾーン問題を回避�E�E    const normalizedDate = typeof record_date === 'string' 
      ? record_date.split('T')[0] 
      : record_date

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      const query = `
        INSERT INTO operations.operation_records (
          vehicle_id,
          operation_date,
          shift_type,
          actual_start_time,
          actual_end_time,
          actual_distance,
          departure_base_id,
          arrival_base_id,
          status,
          notes,
          is_as_planned
        ) VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `
      const params = [
        vehicle_id,
        normalizedDate,
        shift_type || 'day',
        startTime,
        endTime,
        actual_distance,
        departure_base_id,
        arrival_base_id,
        status,
        notes,
        body.is_as_planned || false,
      ]

      const result = await executeQuery(query, params)
      return NextResponse.json(result[0], { status: 201 })
    } else if (dbType === "supabase") {
      const { data, error } = await getSupabaseClient()
        .from("operation_records")
        .insert([body])
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data, { status: 201 })
    } else {
      // モチE��チE�Eタの場吁E      const newRecord = {
        id: Date.now(),
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return NextResponse.json(newRecord, { status: 201 })
    }
  } catch (error) {
    console.error("Error creating operation record:", error)
    return NextResponse.json(
      { error: "Failed to create operation record", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
