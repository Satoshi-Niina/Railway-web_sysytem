import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET() {
  try {
    const bases = await executeQuery(`
      SELECT b.base_id as id, b.base_name, b.base_code, b.location, 
             b.office_id as management_office_id,
             mo.office_name
      FROM master_data.bases b
      LEFT JOIN master_data.managements_offices mo ON b.office_id::text = mo.office_id::text
      ORDER BY b.base_name
    `);
    return NextResponse.json(bases);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.base_name) return NextResponse.json({ error: "base_name is required" }, { status: 400 });
    const result = await executeQuery(`
      INSERT INTO master_data.bases (base_name, base_type, location, office_id, is_active)
      VALUES ($1, $2, $3, $4, true) RETURNING *
    `, [body.base_name, body.base_type || 'maintenance', body.location, body.office_id]);
    return NextResponse.json(result[0], { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}