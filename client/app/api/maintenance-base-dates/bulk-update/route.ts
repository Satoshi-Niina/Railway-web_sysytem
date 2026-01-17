import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { base_dates } = body;
    
    if (!base_dates || !Array.isArray(base_dates)) {
      return NextResponse.json({ error: "base_dates array is required" }, { status: 400 });
    }
    
    let updatedCount = 0;
    
    for (const item of base_dates) {
      const { vehicle_id, inspection_type_id, base_date, source, notes } = item;
      
      if (!vehicle_id || !inspection_type_id || !base_date) {
        continue;
      }
      
      await executeQuery(`
        INSERT INTO master_data.maintenance_base_dates 
          (vehicle_id, inspection_type_id, base_date, source, notes)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (vehicle_id, inspection_type_id) 
        DO UPDATE SET base_date = $3, source = $4, notes = $5, updated_at = CURRENT_TIMESTAMP
      `, [vehicle_id, inspection_type_id, base_date, source || 'manual', notes || null]);
      
      updatedCount++;
    }
    
    return NextResponse.json({ updated: updatedCount });
  } catch (error: any) {
    console.error('Error bulk updating maintenance base dates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}