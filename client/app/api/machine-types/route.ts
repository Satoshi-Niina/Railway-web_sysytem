import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET() {
  try {
    const machineTypes = await executeQuery(`
      SELECT 
        id, 
        type_name, 
        type_code, 
        model_name, 
        model_name as vehicle_type,
        category
      FROM master_data.machine_types
      ORDER BY type_name
    `);
    return NextResponse.json(machineTypes);
  } catch (error: any) {
    console.error('Error fetching machine types:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}