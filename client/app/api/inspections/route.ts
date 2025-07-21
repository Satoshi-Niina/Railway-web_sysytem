import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get("vehicle_id")
    const inspectionType = searchParams.get("inspection_type")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    let query = supabase
      .from("inspections")
      .select(`
        *,
        vehicle:vehicles(*)
      `)
      .order("inspection_date", { ascending: false })

    if (vehicleId) {
      query = query.eq("vehicle_id", vehicleId)
    }

    if (inspectionType) {
      query = query.eq("inspection_type", inspectionType)
    }

    if (startDate) {
      query = query.gte("inspection_date", startDate)
    }

    if (endDate) {
      query = query.lte("inspection_date", endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching inspections:", error)
      return NextResponse.json({ error: "Failed to fetch inspections" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in inspections API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { data, error } = await supabase.from("inspections").insert([body]).select()

    if (error) {
      console.error("Error creating inspection:", error)
      return NextResponse.json({ error: "Failed to create inspection" }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error in inspections API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { id, ...updateData } = body

    const { data, error } = await supabase.from("inspections").update(updateData).eq("id", id).select()

    if (error) {
      console.error("Error updating inspection:", error)
      return NextResponse.json({ error: "Failed to update inspection" }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error in inspections API:", error)
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

    const { error } = await supabase.from("inspections").delete().eq("id", id)

    if (error) {
      console.error("Error deleting inspection:", error)
      return NextResponse.json({ error: "Failed to delete inspection" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in inspections API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
