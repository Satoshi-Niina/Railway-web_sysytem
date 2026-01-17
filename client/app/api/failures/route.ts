import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get("vehicle_id")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    let query = supabase
      .from("failures")
      .select(`
        *,
        vehicle:vehicles(*),
        repairs(*)
      `)
      .order("failure_date", { ascending: false })

    if (vehicleId) {
      query = query.eq("vehicle_id", vehicleId)
    }

    if (startDate) {
      query = query.gte("failure_date", startDate)
    }

    if (endDate) {
      query = query.lte("failure_date", endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching failures:", error)
      return NextResponse.json({ error: "Failed to fetch failures" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error in failures API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { data, error } = await supabase.from("failures").insert([body]).select()

    if (error) {
      console.error("Error creating failure:", error)
      return NextResponse.json({ error: "Failed to create failure" }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error: any) {
    console.error("Error in failures API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { id, ...updateData } = body

    const { data, error } = await supabase.from("failures").update(updateData).eq("id", id).select()

    if (error) {
      console.error("Error updating failure:", error)
      return NextResponse.json({ error: "Failed to update failure" }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error: any) {
    console.error("Error in failures API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DLT(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("failures").delete().eq("id", id)

    if (error) {
      console.error("Error deleting failure:", error)
      return NextResponse.json({ error: "Failed to delete failure" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in failures API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
