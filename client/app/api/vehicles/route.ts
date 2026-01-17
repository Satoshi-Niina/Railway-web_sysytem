import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET() {
  try {
    const query = `
      SELECT 
        v.*,
        v.registration_number as vehicle_number,
        COALESCE(mo.office_name, '未設定') as office_name,
        COALESCE(b.base_name, '未設定') as base_name,
        mt.type_code as vehicle_type,
        mt.type_name as machine_type_name,
        mt.category,
        m.machine_number
      FROM master_data.vehicles v
      LEFT JOIN master_data.machines m ON v.machine_id = m.id
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
      LEFT JOIN master_data.management_offices mo ON v.office_id = mo.office_id
      LEFT JOIN master_data.bases b ON m.assigned_base_id = b.base_id
      ORDER BY v.registration_number
    `;
    const vehicles = await executeQuery(query);
    return NextResponse.json(vehicles);
  } catch (error: any) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}