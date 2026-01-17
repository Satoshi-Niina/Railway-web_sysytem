import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseType, executeQuery, getSupabaseClient } from "@/lib/database"
import type { OperationPlan } from "@/types/database"

// PUT: 運用計画更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      const result = await executeQuery<OperationPlan>(
        `UPDATE operations.operation_plans SET 
          vehicle_id = $1, plan_date = $2::date, end_date = $3::date, shift_type = $4, start_time = $5, end_time = $6,
          planned_distance = $7, departure_base_id = $8, arrival_base_id = $9, notes = $10, updated_at = NOW()
        WHERE id = $11 RETURNING *`,
        [
          body.vehicle_id, body.plan_date, body.end_date || body.plan_date, body.shift_type, body.start_time, body.end_time,
          body.planned_distance, body.departure_base_id, body.arrival_base_id, body.notes, params.id
        ]
      )
      // 日付を正規化（ローカルタイムゾーン対応）
      const formatDate = (date: any) => {
        if (date instanceof Date) {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        } else if (typeof date === 'string' && date.includes('T')) {
          return date.split('T')[0]
        }
        return date
      }
      
      const normalizedResult = {
        ...result[0],
        plan_date: formatDate(result[0].plan_date),
        end_date: formatDate(result[0].end_date)
      }
      return NextResponse.json(normalizedResult)
    } else if (dbType === "supabase") {
      const supabase = getSupabaseClient()
      if (!supabase) {
        return NextResponse.json({ error: "Database not configured" }, { status: 500 })
      }
      
      const { data, error } = await supabase
        .from("operation_plans")
        .update({
          vehicle_id: body.vehicle_id,
          plan_date: body.plan_date,
          end_date: body.end_date || body.plan_date,
          shift_type: body.shift_type,
          start_time: body.start_time,
          end_time: body.end_time,
          planned_distance: body.planned_distance,
          departure_base_id: body.departure_base_id,
          arrival_base_id: body.arrival_base_id,
          notes: body.notes,
          updated_at: new Date().toISOString()
        })
        .eq("id", params.id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    } else {
      // モックモード - グローバル変数にアクセスするため、このファイルでは実装しない
      return NextResponse.json({ error: "Mock mode not supported for individual updates" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error updating operation plan:", error)
    return NextResponse.json({ error: "Failed to update operation plan" }, { status: 500 })
  }
}

// DELETE: 運用計画削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      await executeQuery("DELETE FROM operations.operation_plans WHERE id = $1", [params.id])
      return NextResponse.json({ success: true })
    } else if (dbType === "supabase") {
      const supabase = getSupabaseClient()
      if (!supabase) {
        return NextResponse.json({ error: "Database not configured" }, { status: 500 })
      }
      
      const { error } = await supabase.from("operation_plans").delete().eq("id", params.id)
      if (error) throw error
      return NextResponse.json({ success: true })
    } else {
      // モックモード - グローバル変数にアクセスするため、このファイルでは実装しない
      return NextResponse.json({ error: "Mock mode not supported for individual deletes" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error deleting operation plan:", error)
    return NextResponse.json({ error: "Failed to delete operation plan" }, { status: 500 })
  }
} 