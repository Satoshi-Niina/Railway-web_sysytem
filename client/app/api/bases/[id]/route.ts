import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    await executeQuery(`
      UPDATE master_data.bases 
      SET base_name = $1, base_type = $2, location = $3, office_id = $4
      WHERE base_id = $5
    `, [body.base_name, body.base_type, body.location, body.office_id, params.id]);
    return NextResponse.json({ message: "Updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}