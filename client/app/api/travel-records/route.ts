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
      .from("travel_records")
      .select(`
        *,
        vehicle:vehicles(*)
      `)
      .order("record_date", { ascending: false })

    if (vehicleId) {
      query = query.eq("vehicle_id", vehicleId)
    }

    if (startDate) {
      query = query.gte("record_date", startDate)
    }

    if (endDate) {
      query = query.lte("record_date", endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching travel records:", error)
      return NextResponse.json({ error: "Failed to fetch travel records" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in travel records API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { data, error } = await supabase.from("travel_records").insert([body]).select()

    if (error) {
      console.error("Error creating travel record:", error)
      return NextResponse.json({ error: "Failed to create travel record" }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error in travel records API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { id, ...updateData } = body

    const { data, error } = await supabase.from("travel_records").update(updateData).eq("id", id).select()

    if (error) {
      console.error("Error updating travel record:", error)
      return NextResponse.json({ error: "Failed to update travel record" }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error in travel records API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("travel_records").delete().eq("id", id)

    if (error) {
      console.error("Error deleting travel record:", error)
      return NextResponse.json({ error: "Failed to delete travel record" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in travel records API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
