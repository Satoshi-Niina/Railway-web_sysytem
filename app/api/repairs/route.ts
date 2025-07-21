import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const failureId = searchParams.get("failure_id")

    let query = supabase.from("repairs").select("*").order("repair_date", { ascending: false })

    if (failureId) {
      query = query.eq("failure_id", failureId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching repairs:", error)
      return NextResponse.json({ error: "Failed to fetch repairs" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in repairs API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { data, error } = await supabase.from("repairs").insert([body]).select()

    if (error) {
      console.error("Error creating repair:", error)
      return NextResponse.json({ error: "Failed to create repair" }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error in repairs API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { id, ...updateData } = body

    const { data, error } = await supabase.from("repairs").update(updateData).eq("id", id).select()

    if (error) {
      console.error("Error updating repair:", error)
      return NextResponse.json({ error: "Failed to update repair" }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error in repairs API:", error)
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

    const { error } = await supabase.from("repairs").delete().eq("id", id)

    if (error) {
      console.error("Error deleting repair:", error)
      return NextResponse.json({ error: "Failed to delete repair" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in repairs API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
