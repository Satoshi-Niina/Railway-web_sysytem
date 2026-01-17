import { NextResponse } from "next/server"
import { getDatabaseType, executeQuery, getSupabaseClient } from "@/lib/database"
import type { Base } from "@/types/database"

export async function GET() {
  try {
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      try {
        const bases = await executeQuery(
          `SELECT b.base_id as id, b.base_name, b.base_code, b.location, 
                  b.office_id as management_office_id,
                  b.created_at, b.updated_at,
                  mo.office_name, mo.office_code
           FROM master_data.bases b
           LEFT JOIN master_data.managements_offices mo ON b.office_id::text = mo.office_id::text
           ORDER BY b.base_name`
        )
        return NextResponse.json(bases)
      } catch (error: any) {
        console.error("Database query failed:", error)
        return NextResponse.json(
          { 
            error: "繝・・繧ｿ繝吶・繧ｹ謗･邯壹お繝ｩ繝ｼ縺檎匱逕溘＠縺ｾ縺励◆",
            details: error.message,
            code: error.code
          },
          { status: 500 }
        )
      }
    } else if (dbType === "supabase") {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("bases")
        .select(`
          *,
          management_office:managements_offices(*)
        `)
        .eq("is_active", true)
        .order("base_name")

      if (error) throw error
      return NextResponse.json(data)
    } else {
      // 繝｢繝・け繝・・繧ｿ
      const mockData: Base[] = [
        {
          id: 1,
          base_name: "譛ｬ遉ｾ菫晏ｮ亥渕蝨ｰ",
          base_type: "maintenance",
          location: "譚ｱ莠ｬ",
          management_office_id: 1,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          base_name: "蜩∝ｷ昜ｿ晏ｮ亥渕蝨ｰ",
          base_type: "maintenance",
          location: "譚ｱ莠ｬ",
          management_office_id: 1,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 3,
          base_name: "髢｢隘ｿ菫晏ｮ亥渕蝨ｰ",
          base_type: "maintenance",
          location: "螟ｧ髦ｪ",
          management_office_id: 2,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ]
      return NextResponse.json(mockData)
    }
  } catch (error) {
    console.error("Error fetching bases:", error)
    return NextResponse.json({ error: "Failed to fetch bases" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log("POST /api/bases called")
    
    const body = await request.json()
    console.log("Request body:", body)

    // 繝舌Μ繝・・繧ｷ繝ｧ繝ｳ
    if (!body.base_name || !body.base_type) {
      console.error("Validation failed: missing required fields")
      return NextResponse.json(
        { error: "蝓ｺ蝨ｰ蜷阪→蝓ｺ蝨ｰ繧ｿ繧､繝励・蠢・医〒縺・ },
        { status: 400 }
      )
    }

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      try {
        const result = await executeQuery(`
          INSERT INTO master_data.bases (
            base_name, base_type, location, office_id, is_active
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [
          body.base_name,
          body.base_type,
          body.location || null,
          body.management_office_id || body.office_id || null,
          body.is_active !== false // 繝・ヵ繧ｩ繝ｫ繝医・true
        ])

        if (result.length > 0) {
          console.log("Successfully saved to PostgreSQL:", result[0])
          return NextResponse.json(result[0])
        } else {
          console.error("PostgreSQL insertion failed or no rows returned")
          return NextResponse.json(
            { error: "蝓ｺ蝨ｰ縺ｮ菴懈・縺ｫ螟ｱ謨励＠縺ｾ縺励◆" },
            { status: 500 }
          )
        }
      } catch (error) {
        console.error("Database insertion failed:", error)
        return NextResponse.json(
          { error: "繝・・繧ｿ繝吶・繧ｹ謗･邯壹お繝ｩ繝ｼ縺檎匱逕溘＠縺ｾ縺励◆" },
          { status: 500 }
        )
      }
    } else if (dbType === "supabase") {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("bases")
        .insert({
          base_name: body.base_name,
          base_type: body.base_type,
          location: body.location,
          management_office_id: body.management_office_id,
          is_active: body.is_active !== false
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    } else {
      return NextResponse.json(
        { error: "繝・・繧ｿ繝吶・繧ｹ縺瑚ｨｭ螳壹＆繧後※縺・∪縺帙ｓ" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Unexpected error in POST /api/bases:", error)
    
    return NextResponse.json(
      { 
        error: `繧ｵ繝ｼ繝舌・繧ｨ繝ｩ繝ｼ縺檎匱逕溘＠縺ｾ縺励◆: ${error instanceof Error ? error.message : '荳肴・縺ｪ繧ｨ繝ｩ繝ｼ'}`
      },
      { status: 500 }
    )
  }
}
