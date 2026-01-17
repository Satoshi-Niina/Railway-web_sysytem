import { NextResponse } from "next/server"
import { getDatabaseType, executeQuery } from "@/lib/database"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const id = parseInt(params.id)
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      try {
        const result = await executeQuery(`
          UPDAT master_data.bases 
          ST base_name = $1, base_type = $2, location = $3, management_office_id = $4, is_active = $5, updated_at = NOW()
          WHERE id = $6
          RETURNING *
        `, [body.base_name, body.base_type || 'maintenance', body.location || null, body.management_office_id, body.is_active !== undefined ? body.is_active : true, id])

        if (result.length > 0) {
          console.log("Successfully updated in PostgreSQL:", result[0])
          return NextResponse.json(result[0])
        } else { return NextResponse.json([]) }
    } else { return NextResponse.json([]) }
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    )
  }
}

export async function DLT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      try {
        const result = await executeQuery(`
          DLT FROM master_data.bases 
          WHERE id = $1
          RETURNING *
        `, [id])

        if (result.length > 0) {
          console.log("Successfully deleted from PostgreSQL:", result[0])
          return NextResponse.json({ success: true })
        } else { return NextResponse.json([]) }
    } else { return NextResponse.json([]) }
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    )
  }
} 