import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { uploadFile, STORAGE_FOLDERS } from "@/lib/cloud-storage"

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
        AND table_type = 'BASE TABLE'
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
          STORAGE_FOLDERS.BACKUPS,
          'application/json'
        )
        
        return NextResponse.json({
          success: true,
          destination: 'storage',
          fileUrl,
          fileName,
          size: buffer.length
        })
      } else {
        // 直接ダウンロード
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Length': buffer.length.toString()
          }
        })
      }
    } else if (format === 'sql') {
      // SQL形式でエクスポート
      let sqlContent = `-- Database Export\n-- Date: ${new Date().toISOString()}\n\n`
      
      for (const schema of schemas) {
        sqlContent += `-- Schema: ${schema}\n\n`
        
        const tablesResult = await query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = $1 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `, [schema])
        
        for (const table of tablesResult.rows) {
          const tableName = table.table_name
          const dataResult = await query(`SELECT * FROM ${schema}.${tableName}`)
          
          if (dataResult.rows.length > 0) {
            sqlContent += `-- Table: ${schema}.${tableName}\n`
            
            // INSERT文を生成
            for (const row of dataResult.rows) {
              const columns = Object.keys(row).join(', ')
              const values = Object.values(row).map(v => {
                if (v === null) return 'NULL'
                if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`
                if (v instanceof Date) return `'${v.toISOString()}'`
                return v
              }).join(', ')
              
              sqlContent += `INSERT INTO ${schema}.${tableName} (${columns}) VALUES (${values});\n`
            }
            
            sqlContent += '\n'
          }
        }
      }
      
      const buffer = Buffer.from(sqlContent, 'utf-8')
      const fileName = `database_export_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`
      
      if (destination === 'storage') {
        const fileUrl = await uploadFile(
          buffer,
          fileName,
          STORAGE_FOLDERS.BACKUPS,
          'application/sql'
        )
        
        return NextResponse.json({
          success: true,
          destination: 'storage',
          fileUrl,
          fileName,
          size: buffer.length
        })
      } else {
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/sql',
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Length': buffer.length.toString()
          }
        })
      }
    }
    
    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (error) {
    console.error('Database export failed:', error)
    return NextResponse.json(
      { error: 'データベースのエクスポートに失敗しました' },
      { status: 500 }
    )
  }
}
