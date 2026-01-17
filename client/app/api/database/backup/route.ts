import { NextResponse } from "next/server"
import { query } from "@/lib/database"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs"

const execAsync = promisify(exec)

export async function POST() {
  try {
    // バックアップディレクトリの確認・作成
    const backupDir = path.join(process.cwd(), "backups")
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // バックアップファイル名の生成
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
    const backupFilename = `backup_${timestamp}.sql`
    const backupPath = path.join(backupDir, backupFilename)

    // 環境変数からデータベース接続情報を取得
    const databaseUrl = process.env.DATABAS_URL
    if (!databaseUrl) {
      return NextResponse.json(
        { error: "DATABAS_URL environment variable is not set" },
        { status: 500 }
      )
    }

    // PostgreSQLのバックアップコマンドを実行
    const pgDumpCommand = `pg_dump "${databaseUrl}" > "${backupPath}"`
    
    console.log("Starting database backup...")
    const { stdout, stderr } = await execAsync(pgDumpCommand)
    
    if (stderr) {
      console.error("Backup stderr:", stderr)
    }

    // バックアップファイルのサイズを取得
    const stats = fs.statSync(backupPath)
    const fileSizeInBytes = stats.size
    const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2)

    // バックアップ情報をデータベースに記録（オプション）
    try {
      await query(
        `INSERT INTO database_backups (filename, file_path, file_size, status, created_at) 
         VALUES ($1, $2, $3, $4, NOW())`,
        [backupFilename, backupPath, fileSizeInMB, "completed"]
      )
    } catch (error: any) {
      console.warn("Failed to record backup in database:", error)
    }

    console.log(`Backup completed: ${backupFilename} (${fileSizeInMB} MB)`)

    return NextResponse.json({
      success: true,
      message: "Database backup completed successfully",
      filename: backupFilename,
      size: `${fileSizeInMB} MB`,
      path: backupPath,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error("Backup error:", error)
    return NextResponse.json(
      { 
        error: "Failed to create database backup",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // バックアップディレクトリの確認
    const backupDir = path.join(process.cwd(), "backups")
    if (!fs.existsSync(backupDir)) {
      return NextResponse.json({ backups: [] })
    }

    // バックアップファイル一覧を取得
    const files = fs.readdirSync(backupDir)
    const backups = files
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const filePath = path.join(backupDir, file)
        const stats = fs.statSync(filePath)
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2)
        
        return {
          id: file.replace('.sql', ''),
          filename: file,
          size: `${sizeInMB} MB`,
          created_at: stats.birthtime.toISOString(),
          status: "completed" as const
        }
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({ backups })

  } catch (error: any) {
    console.error("Error fetching backups:", error)
    return NextResponse.json(
      { error: "Failed to fetch backup list" },
      { status: 500 }
    )
  }
} 