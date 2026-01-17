import { NextRequest, NextResponse } from "next/server"
import { query, transaction } from "@/lib/database"

// データベースへのインポート
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const format = formData.get('format') as string
    
    if (!file) {
      return NextResponse.json({ error: 'ファイルが指定されていません' }, { status: 400 })
    }
    
    const fileContent = await file.text()
    
    if (format === 'json') {
      // JSON形式のインポート
      const importData = JSON.parse(fileContent)
      
      // バリデーション
      if (!importData.schemas) {
        return NextResponse.json({ error: '無効なJSONフォーマットです' }, { status: 400 })
      }
      
      // トランザクション内でインポート
      await transaction(async (client) => {
        let totalRows = 0
        
        for (const [schemaName, schemaData] of Object.entries(importData.schemas)) {
          for (const [tableName, tableData] of Object.entries(schemaData as any)) {
            const rows = tableData as any[]
            
            if (rows.length > 0) {
              // テーブルのカラム情報を取得
              const columns = Object.keys(rows[0])
              
              for (const row of rows) {
                const values = columns.map((col: string) => row[col])
                const placeholders = values.map((_: any, i: number) => `$${i + 1}`).join(', ')
                
                // UPSERT (INSERT ... ON CONFLICT DO UPDATE)
                const insertQuery = `
                  INSERT INTO ${schemaName}.${tableName} (${columns.join(', ')})
                  VALUES (${placeholders})
                  ON CONFLICT (id) DO UPDATE SET
                  ${columns.filter((col: string) => col !== 'id').map((col: string, i: number) => 
                    `${col} = EXCLUDED.${col}`
                  ).join(', ')}
                `
                
                await client.query(insertQuery, values)
                totalRows++
              }
            }
          }
        }
        
        return { totalRows }
      })
      
      return NextResponse.json({
        success: true,
        message: 'データのインポートが完了しました'
      })
    } else if (format === 'sql') {
      // SQL形式のインポート
      await transaction(async (client) => {
        // SQLファイルを実行
        const statements = fileContent
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'))
        
        for (const statement of statements) {
          await client.query(statement)
        }
      })
      
      return NextResponse.json({
        success: true,
        message: 'SQLファイルのインポートが完了しました'
      })
    }
    
    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (error) {
    console.error('Database import failed:', error)
    return NextResponse.json(
      { error: 'データベースのインポートに失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
