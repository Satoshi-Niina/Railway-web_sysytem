import { type NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

// GET /api/operation-records/:id - 特定の運用実績を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const result = await executeQuery(`
      SELECT or_table.*, 
             or_table.record_id as id,
             TO_CHAR(or_table.operation_date, 'YYYY-MM-DD') as record_date,
             m.machine_number, mt.type_name as vehicle_type
      FROM operations.operation_records or_table
      LEFT JOIN master_data.machines m ON or_table.vehicle_id::text = m.id::text
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id::text = mt.id::text
      WHERE or_table.record_id = $1
    `, [id]);

    if (result.length === 0) {
      return NextResponse.json({ error: "運用実績が見つかりません" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error("運用実績取得エラー:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/operation-records/:id - 運用実績を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log("[PUT /api/operation-records/:id] 更新リクエスト:", { id, body });

    const result = await executeQuery(`
      UPDATE operations.operation_records
      SET 
        vehicle_id = $1,
        operation_date = $2::date,
        shift_type = $3,
        actual_start_time = $4,
        actual_end_time = $5,
        actual_distance = $6,
        departure_base_id = $7,
        arrival_base_id = $8,
        status = $9,
        notes = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE record_id = $11
      RETURNING *, record_id as id, TO_CHAR(operation_date, 'YYYY-MM-DD') as record_date
    `, [
      body.vehicle_id,
      body.record_date,
      body.shift_type || 'day',
      body.actual_start_time,
      body.actual_end_time,
      body.actual_distance,
      body.departure_base_id,
      body.arrival_base_id,
      body.status,
      body.notes,
      id
    ]);

    if (result.length === 0) {
      return NextResponse.json({ error: "運用実績が見つかりません" }, { status: 404 });
    }

    console.log("[PUT /api/operation-records/:id] 更新成功:", result[0]);
    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error("運用実績更新エラー:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/operation-records/:id - 運用実績を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log("[DELETE /api/operation-records/:id] 削除リクエスト:", { id });

    const result = await executeQuery(`
      DELETE FROM operations.operation_records
      WHERE record_id = $1
      RETURNING record_id
    `, [id]);

    if (result.length === 0) {
      return NextResponse.json({ error: "運用実績が見つかりません" }, { status: 404 });
    }

    console.log("[DELETE /api/operation-records/:id] 削除成功:", result[0]);
    return NextResponse.json({ message: "運用実績を削除しました", id: result[0].record_id });
  } catch (error: any) {
    console.error("運用実績削除エラー:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}