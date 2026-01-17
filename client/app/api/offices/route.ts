import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET() {
  try {
    const offices = await executeQuery(`
      SELECT office_id, office_name, office_code
      FROM master_data.management_offices
      ORDER BY office_name
    `);
    return NextResponse.json(offices);
  } catch (error: any) {
    console.error('Error fetching offices:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}