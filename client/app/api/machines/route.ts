import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function GET() {
  console.log('=== Machines API GET called ===')
  console.log('Time:', new Date().toISOString())
  
  try {
    console.log('Step 1: Executing query...')
    
    const machines = await executeQuery(`
      SELECT 
        m.id,
        m.machine_number,
        m.machine_type_id,
        m.office_id,
        mt.type_name as machine_type,
        mt.model_name,
        mt.manufacturer,
        mt.category,
        mo.office_name,
        m.created_at,
        m.updated_at
      FROM master_data.machines m
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id = mt.id
      LEFT JOIN master_data.managements_offices mo ON m.office_id::text = mo.office_id::text
      ORDER BY m.machine_number
    `)
    
    console.log('Step 2: Query completed successfully')
    console.log('Machines fetched:', machines.length)
    
    if (machines.length > 0) {
      console.log('Sample machine:', JSON.stringify(machines[0], null, 2))
    }
    
    console.log('Step 3: Returning JSON response')
    return NextResponse.json(machines)
    
  } catch (error: any) {
    console.error('❌ Machines API error occurred')
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('Error code:', error.code)
    
    return NextResponse.json({ 
      error: error.message,
      code: error.code,
      details: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
