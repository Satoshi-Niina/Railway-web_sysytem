import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ message: "Export not implemented in this version" }, { status: 501 });
}