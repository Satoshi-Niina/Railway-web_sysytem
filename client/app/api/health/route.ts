import { NextResponse } from "next/server"
import { testConnection, getDatabaseInfo } from "@/lib/database"

export async function GET() {
  try {
    const dbConnected = await testConnection()
    const dbInfo = await getDatabaseInfo()
    
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: dbConnected ? "connected" : "disconnected",
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0",
      databaseInfo: dbInfo
    })
  } catch (error) {
    console.error("Health check failed:", error)
    
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      environment: process.env.NODE_ENV || "development"
    }, { status: 500 })
  }
} 