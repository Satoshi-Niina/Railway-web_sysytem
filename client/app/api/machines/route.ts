import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET() {
  try {
    const machines = await executeQuery(`
      SELECT 
        m.id, 
        m.machine_number, 
        m.serial_number, 
        m.machine_type_id,
        mt.type_name, 
        mt.model_name,
        mt.model_name as vehicle_type
      FROM master_data.machines m
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
      ORDER BY m.machine_number
    `);
    return NextResponse.json(machines);
  } catch (error: any) {
    console.error('Error fetching machines:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}