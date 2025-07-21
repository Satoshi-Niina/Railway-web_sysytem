import { NextResponse } from "next/server"
import { query } from "@/lib/database"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs"

const execAsync = promisify(exec)

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // バックアップディレクトリの確認
    const backupDir = path.join(process.cwd(), "backups")
    if (!fs.existsSync(backupDir)) {
      return NextResponse.json(
        { error: "Backup directory not found" },
        { status: 404 }
      )
    }

    // バックアップファイルの存在確認
    const backupFilename = `${id}.sql`
    const backupPath = path.join(backupDir, backupFilename)
    
    if (!fs.existsSync(backupPath)) {
      return NextResponse.json(
        { error: "Backup file not found" },
        { status: 404 }
      )
    }

    // 環境変数からデータベース接続情報を取得
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      return NextResponse.json(
        { error: "DATABASE_URL environment variable is not set" },
        { status: 500 }
      )
    }

    // 復元前の確認（本番環境では追加の確認が必要）
    const { searchParams } = new URL(request.url)
    const confirm = searchParams.get('confirm')
    
    if (confirm !== 'true') {
      return NextResponse.json(
        { 
          error: "Restore confirmation required",
          message: "Add ?confirm=true to the URL to confirm the restore operation"
        },
        { status: 400 }
      )
    }

    console.log(`Starting database restore from: ${backupFilename}`)

    // PostgreSQLの復元コマンドを実行
    const pgRestoreCommand = `psql "${databaseUrl}" < "${backupPath}"`
    
    const { stdout, stderr } = await execAsync(pgRestoreCommand)
    
    if (stderr) {
      console.error("Restore stderr:", stderr)
      // エラーが含まれていても復元が成功している場合があるため、警告として扱う
    }

    // 復元情報をデータベースに記録（オプション）
    try {
      await query(
        `INSERT INTO database_restores (backup_filename, restored_at, status) 
         VALUES ($1, NOW(), $2)`,
        [backupFilename, "completed"]
      )
    } catch (error) {
      console.warn("Failed to record restore in database:", error)
    }

    console.log(`Restore completed from: ${backupFilename}`)

    return NextResponse.json({
      success: true,
      message: "Database restore completed successfully",
      backup_file: backupFilename,
      restored_at: new Date().toISOString()
    })

  } catch (error) {
    console.error("Restore error:", error)
    return NextResponse.json(
      { 
        error: "Failed to restore database",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // バックアップディレクトリの確認
    const backupDir = path.join(process.cwd(), "backups")
    if (!fs.existsSync(backupDir)) {
      return NextResponse.json(
        { error: "Backup directory not found" },
        { status: 404 }
      )
    }

    // バックアップファイルの存在確認
    const backupFilename = `${id}.sql`
    const backupPath = path.join(backupDir, backupFilename)
    
    if (!fs.existsSync(backupPath)) {
      return NextResponse.json(
        { error: "Backup file not found" },
        { status: 404 }
      )
    }

    // バックアップファイルの情報を取得
    const stats = fs.statSync(backupPath)
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2)

    return NextResponse.json({
      id,
      filename: backupFilename,
      size: `${sizeInMB} MB`,
      created_at: stats.birthtime.toISOString(),
      modified_at: stats.mtime.toISOString(),
      path: backupPath,
      exists: true
    })

  } catch (error) {
    console.error("Error fetching backup info:", error)
    return NextResponse.json(
      { error: "Failed to fetch backup information" },
      { status: 500 }
    )
  }
} 