import { type NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    let query = `
      SELECT or_table.*, 
             or_table.record_id as id,
             TO_CHAR(or_table.operation_date, 'YYYY-MM-DD') as record_date,
             m.machine_number, mt.type_name as vehicle_type
      FROM operations.operation_records or_table
      LEFT JOIN master_data.machines m ON or_table.vehicle_id::text = m.id::text
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id::text = mt.id::text
      WHERE 1=1
    `;
    const params: any[] = [];
    if (month) {
      query += " AND DATE_TRUNC('month', or_table.operation_date) = DATE_TRUNC('month', $1::date)";
      params.push(\`\${month}-01\`);
    }

    const records = await executeQuery(query, params);
    return NextResponse.json(records);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await executeQuery(\`
      INSERT INTO operations.operation_records (
        vehicle_id, operation_date, shift_type, actual_start_time, actual_end_time,
        actual_distance, departure_base_id, arrival_base_id, status, notes
      ) VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    \`, [
      body.vehicle_id, body.record_date, body.shift_type || 'day', 
      body.actual_start_time, body.actual_end_time, body.actual_distance,
      body.departure_base_id, body.arrival_base_id, body.status, body.notes
    ]);
    return NextResponse.json(result[0], { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
