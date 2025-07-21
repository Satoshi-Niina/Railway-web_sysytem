import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// 外部システムからの実績データ自動取り込みAPI
export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { records } = body // 複数の実績データを一括処理

    if (!Array.isArray(records)) {
      return NextResponse.json({ error: "Records must be an array" }, { status: 400 })
    }

    const results = []

    for (const record of records) {
      const {
        vehicle_name,
        record_date,
        shift_type,
        actual_start_time,
        actual_end_time,
        actual_distance,
        departure_base_name,
        arrival_base_name,
        status = "completed",
        notes,
      } = record

      // 車両名から車両IDを取得
      const { data: vehicle } = await supabase.from("vehicles").select("id").eq("name", vehicle_name).single()

      if (!vehicle) {
        results.push({ error: `Vehicle not found: ${vehicle_name}` })
        continue
      }

      // 基地名から基地IDを取得
      let departure_base_id = null
      let arrival_base_id = null

      if (departure_base_name) {
        const { data: depBase } = await supabase
          .from("bases")
          .select("id")
          .eq("base_name", departure_base_name)
          .single()
        departure_base_id = depBase?.id
      }

      if (arrival_base_name) {
        const { data: arrBase } = await supabase.from("bases").select("id").eq("base_name", arrival_base_name).single()
        arrival_base_id = arrBase?.id
      }

      // 対応する計画があるかチェック
      const { data: plan } = await supabase
        .from("operation_plans")
        .select("id")
        .eq("vehicle_id", vehicle.id)
        .eq("plan_date", record_date)
        .eq("shift_type", shift_type)
        .single()

      // 実績データを挿入
      const { data, error } = await supabase
        .from("operation_records")
        .insert([
          {
            plan_id: plan?.id,
            vehicle_id: vehicle.id,
            record_date,
            shift_type,
            actual_start_time,
            actual_end_time,
            actual_distance,
            departure_base_id,
            arrival_base_id,
            status,
            notes,
            auto_imported: true,
          },
        ])
        .select()
        .single()

      if (error) {
        results.push({ error: error.message })
      } else {
        results.push({ success: true, id: data.id })
      }
    }

    return NextResponse.json({ results }, { status: 201 })
  } catch (error) {
    console.error("Error auto-importing records:", error)
    return NextResponse.json({ error: "Failed to auto-import records" }, { status: 500 })
  }
}
