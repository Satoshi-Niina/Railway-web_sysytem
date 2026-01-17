import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ message: "Auto-import not implemented in this version" }, { status: 501 });
}