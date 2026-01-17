import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET() {
  try {
    const baseDates = await executeQuery(`
      SELECT 
        mbd.id,
        mbd.vehicle_id,
        mbd.inspection_type_id,
        mbd.base_date,
        mbd.source,
        mbd.notes,
        mbd.created_at,
        mbd.updated_at
      FROM master_data.maintenance_base_dates mbd
      ORDER BY mbd.vehicle_id, mbd.inspection_type_id
    `);
    return NextResponse.json(baseDates);
  } catch (error: any) {
    console.error('Error fetching maintenance base dates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vehicle_id, inspection_type_id, base_date, source, notes } = body;
    
    if (!vehicle_id || !inspection_type_id || !base_date) {
      return NextResponse.json({ error: "vehicle_id, inspection_type_id, and base_date are required" }, { status: 400 });
    }
    
    const result = await executeQuery(`
      INSERT INTO master_data.maintenance_base_dates 
        (vehicle_id, inspection_type_id, base_date, source, notes)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (vehicle_id, inspection_type_id) 
      DO UPDATE SET base_date = $3, source = $4, notes = $5, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [vehicle_id, inspection_type_id, base_date, source || 'manual', notes]);
    
    return NextResponse.json(result[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating maintenance base date:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}