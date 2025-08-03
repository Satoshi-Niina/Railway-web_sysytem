import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseType, executeQuery } from "@/lib/database"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { vehicle_type, inspection_type, cycle_days, description, is_active } = body
    const id = parseInt(params.id)

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      const result = await executeQuery(
        `UPDATE maintenance_cycles 
         SET vehicle_type = $1, inspection_type = $2, cycle_days = $3, description = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [vehicle_type, inspection_type, cycle_days, description, is_active, id]
      )
      
      if (result.length === 0) {
        return NextResponse.json({ error: "Maintenance cycle not found" }, { status: 404 })
      }
      
      return NextResponse.json(result[0])
    } else {
      // モックデータ更新
      return NextResponse.json({
        id,
        vehicle_type,
        inspection_type,
        cycle_days,
        description,
        is_active,
        updated_at: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error("Error updating maintenance cycle:", error)
    return NextResponse.json({ error: "Failed to update maintenance cycle" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      // 対象車両数が0の場合のみ削除可能
      const checkResult = await executeQuery(
        `SELECT COUNT(v.id) as vehicle_count
         FROM maintenance_cycles mc
         LEFT JOIN vehicles v ON mc.vehicle_type = v.vehicle_type AND v.status = 'active'
         WHERE mc.id = $1
         GROUP BY mc.id`,
        [id]
      )
      
      if (checkResult.length === 0) {
        return NextResponse.json({ error: "Maintenance cycle not found" }, { status: 404 })
      }
      
      if (checkResult[0].vehicle_count > 0) {
        return NextResponse.json({ error: "Cannot delete cycle with active vehicles" }, { status: 400 })
      }
      
      const result = await executeQuery(
        "DELETE FROM maintenance_cycles WHERE id = $1 RETURNING *",
        [id]
      )
      
      if (result.length === 0) {
        return NextResponse.json({ error: "Maintenance cycle not found" }, { status: 404 })
      }
      
      return NextResponse.json({ message: "Maintenance cycle deleted successfully" })
    } else {
      // モックデータ削除
      return NextResponse.json({ message: "Maintenance cycle deleted successfully" })
    }
  } catch (error) {
    console.error("Error deleting maintenance cycle:", error)
    return NextResponse.json({ error: "Failed to delete maintenance cycle" }, { status: 500 })
  }
} 