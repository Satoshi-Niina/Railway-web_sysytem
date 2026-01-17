import { NextRequest, NextResponse } from "next/server"
import { executeQuery, getDatabaseType } from "@/lib/database"

// 基地コード生成関数�E�基地名�E頭2斁E��をローマ字に変換�E�Efunction generateBaseCode(baseName: string): string {
  const romajiMap: { [key: string]: string } = {
    'ぁE: 'A', 'ぁE: 'I', 'ぁE: 'U', 'ぁE: 'E', 'ぁE: 'O',
    'ぁE: 'KA', 'ぁE: 'KI', 'ぁE: 'KU', 'ぁE: 'KE', 'ぁE: 'KO',
    'ぁE: 'SA', 'ぁE: 'SHI', 'ぁE: 'SU', 'ぁE: 'SE', 'ぁE: 'SO',
    'ぁE: 'TA', 'ち': 'CHI', 'つ': 'TSU', 'て': 'TE', 'と': 'TO',
    'な': 'NA', 'に': 'NI', 'ぬ': 'NU', 'ね': 'NE', 'の': 'NO',
    'は': 'HA', 'ひ': 'HI', 'ふ': 'FU', 'へ': 'HE', 'ほ': 'HO',
    'ま': 'MA', 'み': 'MI', 'む': 'MU', 'めE: 'ME', 'めE: 'MO',
    'めE: 'YA', 'めE: 'YU', 'めE: 'YO',
    'めE: 'RA', 'めE: 'RI', 'めE: 'RU', 'めE: 'RE', 'めE: 'RO',
    'めE: 'WA', 'めE: 'WO', 'めE: 'N',
    'ぁE: 'GA', 'ぁE: 'GI', 'ぁE: 'GU', 'ぁE: 'GE', 'ぁE: 'GO',
    'ぁE: 'ZA', 'ぁE: 'JI', 'ぁE: 'ZU', 'ぁE: 'ZE', 'ぁE: 'ZO',
    'だ': 'DA', 'ぢ': 'JI', 'づ': 'ZU', 'で': 'DE', 'ど': 'DO',
    'ば': 'BA', 'び': 'BI', 'ぶ': 'BU', 'べ': 'BE', 'ぼ': 'BO',
    'ぱ': 'PA', 'ぴ': 'PI', 'ぷ': 'PU', 'ぺ': 'PE', 'ぽ': 'PO',
    'きゃ': 'KYA', 'きゅ': 'KYU', 'きょ': 'KYO',
    'しゃ': 'SHA', 'しゅ': 'SHU', 'しょ': 'SHO',
    'ちめE: 'CHA', 'ちめE: 'CHU', 'ちめE: 'CHO',
    'にめE: 'NYA', 'にめE: 'NYU', 'にめE: 'NYO',
    'ひめE: 'HYA', 'ひめE: 'HYU', 'ひめE: 'HYO',
    'みめE: 'MYA', 'みめE: 'MYU', 'みめE: 'MYO',
    'りゃ': 'RYA', 'りゅ': 'RYU', 'りょ': 'RYO',
    'ぎゃ': 'GYA', 'ぎゅ': 'GYU', 'ぎょ': 'GYO',
    'じゃ': 'JA', 'じゅ': 'JU', 'じょ': 'JO',
    'びめE: 'BYA', 'びめE: 'BYU', 'びめE: 'BYO',
    'ぴめE: 'PYA', 'ぴめE: 'PYU', 'ぴめE: 'PYO',
    '本': 'HO', '社': 'SHA', '関': 'KA', '西': 'SEI', '支': 'SHI',
    '俁E: 'HO', '宁E: 'SHU', '基': 'KI', '地': 'CHI'
  }

  let result = ''
  let i = 0
  while (i < baseName.length && result.length < 2) {
    // 2斁E���E絁E��合わせを先にチェチE��
    if (i < baseName.length - 1) {
      const twoChar = baseName.substring(i, i + 2)
      if (romajiMap[twoChar]) {
        result += romajiMap[twoChar]
        i += 2
        continue
      }
    }
    
    // 1斁E��ずつチェチE��
    const char = baseName[i]
    if (romajiMap[char]) {
      result += romajiMap[char]
    } else if (/[A-Za-z]/.test(char)) {
      result += char.toUpperCase()
    } else if (/[0-9]/.test(char)) {
      result += char
    }
    i++
  }
  
  // 結果ぁE斁E��未満の場合�E0で埋めめE  while (result.length < 2) {
    result += '0'
  }
  
  // 最初�E2斁E��を取得し、ランダムな2桁�E数字を追加
  const prefix = result.substring(0, 2)
  const randomNum = Math.floor(Math.random() * 100) + 1
  return `${prefix}${String(randomNum).padStart(2, '0')}`
}

export async function GET() {
  try {
    console.log("GET /api/maintenance-bases called")
    
    const dbType = getDatabaseType()
    console.log("Database type:", dbType)

    if (dbType === "postgresql") {
      try {
        const bases = await executeQuery(`
          SELECT mb.*, mo.office_name, mo.office_code
          FROM master_data.bases mb
          LEFT JOIN master_data.managements_offices mo ON mb.management_office_id = mo.id
          ORDER BY mb.base_name
        `)
        console.log("PostgreSQL query result:", bases)
        return NextResponse.json(bases)
      } catch (error) {
        console.error("Database query failed:", error)
        return NextResponse.json(
          { error: "チE�Eタベ�Eス接続エラーが発生しました" },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { error: "チE�Eタベ�Eスが設定されてぁE��せん" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Unexpected error in GET /api/maintenance-bases:", error)
    return NextResponse.json(
      { error: "サーバ�Eエラーが発生しました" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log("POST /api/maintenance-bases called")
    
    // 環墁E��数の確誁E    console.log("Environment variables check:")
    console.log("NEXT_PUBLIC_SUPABASE_URL:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("SUPABASE_SERVICE_ROLE_KEY:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    const body = await request.json()
    console.log("Request body:", body)

    // バリチE�Eション
    if (!body.base_name || !body.management_office_id) {
      console.error("Validation failed: missing required fields")
      return NextResponse.json(
        { error: "基地名と管琁E��業所は忁E��でぁE },
        { status: 400 }
      )
    }

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      try {
        // base_codeを�E動生成（基地名�E頭2斁E��をローマ字に変換 + 連番�E�E        const baseCode = generateBaseCode(body.base_name)
        console.log("Generated base_code:", baseCode)

        const result = await executeQuery(`
          INSERT INTO master_data.bases (base_name, base_type, location, management_office_id, is_active)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [body.base_name, body.base_type || 'maintenance', body.location || null, body.management_office_id, true])

        if (result.length > 0) {
          console.log("Successfully saved to PostgreSQL:", result[0])
          return NextResponse.json(result[0])
        } else {
          console.error("PostgreSQL insertion failed or no rows returned")
          return NextResponse.json(
            { error: "保守基地の作�Eに失敗しました" },
            { status: 500 }
          )
        }
      } catch (error) {
        console.error("Database insertion failed:", error)
        return NextResponse.json(
          { error: "チE�Eタベ�Eス接続エラーが発生しました" },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { error: "チE�Eタベ�Eスが設定されてぁE��せん" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Unexpected error in POST /api/maintenance-bases:", error)
    
    // エラーの詳細をログに出劁E    if (error instanceof Error) {
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    
    return NextResponse.json(
      { 
        error: `サーバ�Eエラーが発生しました: ${error instanceof Error ? error.message : '不�Eなエラー'}`,
        details: error instanceof Error ? error.stack : 'No stack trace available'
      },
      { status: 500 }
    )
  }
}

 