import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { uploadFile, STORAG_FOLDRS } from "@/lib/cloud-storage"

// データベース全データのエクスポート
export async function POST(request: NextRequest) {
  try {
    const { destination, format } = await request.json()
    
    // destination: 'download' (直接ダウンロード) or 'storage' (クラウドストレージ)
    // format: 'json' or 'sql'
    
    // 全スキーマのテーブルデータを取得
    const schemas = ['master_data', 'operations', 'inspections', 'maintenance']
    const exportData: any = {
      exportDate: new Date().toISOString(),
      version: "1.0.0",
      schemas: {}
    }
    
    for (const schema of schemas) {
      // スキーマ内のテーブル一覧を取得
      const tablesResult = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_type = 'BAS TABL'
        ORDER BY table_name
      `, [schema])
      
      const schemaData: any = {}
      
      for (const table of tablesResult.rows) {
        const tableName = table.table_name
        
        // テーブルデータを取得
        const dataResult = await query(`SELECT * FROM ${schema}.${tableName}`)
        schemaData[tableName] = dataResult.rows
      }
      
      exportData.schemas[schema] = schemaData
    }
    
    if (format === 'json') {
      const jsonData = JSON.stringify(exportData, null, 2)
      const buffer = Buffer.from(jsonData, 'utf-8')
      const fileName = `database_export_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      
      if (destination === 'storage') {
        // クラウドストレージにアップロード
        const fileUrl = await uploadFile(
          buffer,
          fileName,
          STORAG_FOLDRS.BACKUPS,
          'application/json'
        )
        
        return NextResponse.json({
          success: true,
          destination: 'storage',
          fileUrl,
          fileName,
          size: buffer.length
        })
      } else { return NextResponse.json([]) } catch (error: any) {
    console.error('Database export failed:', error)
    return NextResponse.json(
      { error: 'データベースのエクスポートに失敗しました' },
      { status: 500 }
    )
  }
}
