import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function GET() {
  try {
    console.log('=== Machine Types API GET called ===')
    
    const types = await executeQuery(`
      SELECT 
        id, 
        type_name, 
        model_name, 
        manufacturer,
        category,
        description
      FROM master_data.machine_types
      ORDER BY model_name, type_name
    `)
    
    console.log('Machine types fetched:', types.length)
    return NextResponse.json(types)
  } catch (error: any) {
    console.error('Machine types API error:', error)
    return NextResponse.json({ 
      error: error.message,
      details: error.stack 
    }, { status: 500 })
  }
}
