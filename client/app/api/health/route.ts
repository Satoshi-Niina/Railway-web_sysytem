import { NextResponse } from "next/server"

export async function GET() {
  try {
    return NextResponse.json({
      status: "healthy",
      message: "Railway Maintenance System API is running",
      time: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json(
      { status: "unhealthy", message: "API check failed" },
      { status: 500 }
    )
  }
} 