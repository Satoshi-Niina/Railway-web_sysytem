import { NextRequest, NextResponse } from "next/server"
import { executeQuery, getDatabaseType } from "@/lib/database"

// 基地コード生成関数（基地名の頭2文字をローマ字に変換）
function generateBaseCode(baseName: string): string {
  const romajiMap: { [key: string]: string } = {
    'あ': 'A', 'い': 'I', 'う': 'U', 'え': 'E', 'お': 'O',
    'か': 'KA', 'き': 'KI', 'く': 'KU', 'け': 'KE', 'こ': 'KO',
    'さ': 'SA', 'し': 'SHI', 'す': 'SU', 'せ': 'SE', 'そ': 'SO',
    'た': 'TA', 'ち': 'CHI', 'つ': 'TSU', 'て': 'TE', 'と': 'TO',
    'な': 'NA', 'に': 'NI', 'ぬ': 'NU', 'ね': 'NE', 'の': 'NO',
    'は': 'HA', 'ひ': 'HI', 'ふ': 'FU', 'へ': 'HE', 'ほ': 'HO',
    'ま': 'MA', 'み': 'MI', 'む': 'MU', 'め': 'ME', 'も': 'MO',
    'や': 'YA', 'ゆ': 'YU', 'よ': 'YO',
    'ら': 'RA', 'り': 'RI', 'る': 'RU', 'れ': 'RE', 'ろ': 'RO',
    'わ': 'WA', 'を': 'WO', 'ん': 'N',
    'が': 'GA', 'ぎ': 'GI', 'ぐ': 'GU', 'げ': 'GE', 'ご': 'GO',
    'ざ': 'ZA', 'じ': 'JI', 'ず': 'ZU', 'ぜ': 'ZE', 'ぞ': 'ZO',
    'だ': 'DA', 'ぢ': 'JI', 'づ': 'ZU', 'で': 'DE', 'ど': 'DO',
    'ば': 'BA', 'び': 'BI', 'ぶ': 'BU', 'べ': 'BE', 'ぼ': 'BO',
    'ぱ': 'PA', 'ぴ': 'PI', 'ぷ': 'PU', 'ぺ': 'PE', 'ぽ': 'PO',
    'きゃ': 'KYA', 'きゅ': 'KYU', 'きょ': 'KYO',
    'しゃ': 'SHA', 'しゅ': 'SHU', 'しょ': 'SHO',
    'ちゃ': 'CHA', 'ちゅ': 'CHU', 'ちょ': 'CHO',
    'にゃ': 'NYA', 'にゅ': 'NYU', 'にょ': 'NYO',
    'ひゃ': 'HYA', 'ひゅ': 'HYU', 'ひょ': 'HYO',
    'みゃ': 'MYA', 'みゅ': 'MYU', 'みょ': 'MYO',
    'りゃ': 'RYA', 'りゅ': 'RYU', 'りょ': 'RYO',
    'ぎゃ': 'GYA', 'ぎゅ': 'GYU', 'ぎょ': 'GYO',
    'じゃ': 'JA', 'じゅ': 'JU', 'じょ': 'JO',
    'びゃ': 'BYA', 'びゅ': 'BYU', 'びょ': 'BYO',
    'ぴゃ': 'PYA', 'ぴゅ': 'PYU', 'ぴょ': 'PYO',
    '本': 'HO', '社': 'SHA', '関': 'KA', '西': 'SEI', '支': 'SHI',
    '保': 'HO', '守': 'SHU', '基': 'KI', '地': 'CHI'
  }

  let result = ''
  let i = 0
  while (i < baseName.length && result.length < 2) {
    // 2文字の組み合わせを先にチェック
    if (i < baseName.length - 1) {
      const twoChar = baseName.substring(i, i + 2)
      if (romajiMap[twoChar]) {
        result += romajiMap[twoChar]
        i += 2
        continue
      }
    }
    
    // 1文字ずつチェック
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
  
  // 結果が2文字未満の場合は0で埋める
  while (result.length < 2) {
    result += '0'
  }
  
  // 最初の2文字を取得し、ランダムな2桁の数字を追加
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
          FROM maintenance_bases mb
          LEFT JOIN management_offices mo ON mb.management_office_id = mo.id
          ORDER BY mb.base_name
        `)
        console.log("PostgreSQL query result:", bases)
        return NextResponse.json(bases)
      } catch (error) {
        console.error("Database query failed:", error)
        return NextResponse.json(
          { error: "データベース接続エラーが発生しました" },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { error: "データベースが設定されていません" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Unexpected error in GET /api/maintenance-bases:", error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log("POST /api/maintenance-bases called")
    
    // 環境変数の確認
    console.log("Environment variables check:")
    console.log("NEXT_PUBLIC_SUPABASE_URL:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("SUPABASE_SERVICE_ROLE_KEY:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    const body = await request.json()
    console.log("Request body:", body)

    // バリデーション
    if (!body.base_name || !body.management_office_id) {
      console.error("Validation failed: missing required fields")
      return NextResponse.json(
        { error: "基地名と管理事業所は必須です" },
        { status: 400 }
      )
    }

    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      try {
        // base_codeを自動生成（基地名の頭2文字をローマ字に変換 + 連番）
        const baseCode = generateBaseCode(body.base_name)
        console.log("Generated base_code:", baseCode)

        const result = await executeQuery(`
          INSERT INTO maintenance_bases (base_name, base_code, location, address, management_office_id)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [body.base_name, baseCode, body.location || null, body.address || null, body.management_office_id])

        if (result.length > 0) {
          console.log("Successfully saved to PostgreSQL:", result[0])
          return NextResponse.json(result[0])
        } else {
          console.error("PostgreSQL insertion failed or no rows returned")
          return NextResponse.json(
            { error: "保守基地の作成に失敗しました" },
            { status: 500 }
          )
        }
      } catch (error) {
        console.error("Database insertion failed:", error)
        return NextResponse.json(
          { error: "データベース接続エラーが発生しました" },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { error: "データベースが設定されていません" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Unexpected error in POST /api/maintenance-bases:", error)
    
    // エラーの詳細をログに出力
    if (error instanceof Error) {
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    
    return NextResponse.json(
      { 
        error: `サーバーエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
        details: error instanceof Error ? error.stack : 'No stack trace available'
      },
      { status: 500 }
    )
  }
}

 