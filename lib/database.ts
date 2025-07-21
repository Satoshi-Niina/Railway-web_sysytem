import { Pool } from "pg"

let pool: Pool | null = null

export function getPool() {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

    if (!databaseUrl) {
      throw new Error("DATABASE_URL or POSTGRES_URL environment variable is required")
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      // パフォーマンス最適化設定
      max: 10, // 接続数を削減
      min: 2,  // 最小接続数を設定
      idleTimeoutMillis: 10000, // アイドルタイムアウトを短縮
      connectionTimeoutMillis: 5000, // 接続タイムアウトを延長
      // 接続プールの最適化
      allowExitOnIdle: true,
      // クエリタイムアウト
      statement_timeout: 30000,
    })
  }

  return pool
}

export async function query(text: string, params?: any[]) {
  const pool = getPool()
  const client = await pool.connect()

  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}

export async function transaction(callback: (client: any) => Promise<any>) {
  const pool = getPool()
  const client = await pool.connect()

  try {
    await client.query("BEGIN")
    const result = await callback(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

// データベース接続テスト
export async function testConnection() {
  try {
    const result = await query("SELECT NOW()")
    console.log("Database connection successful:", result.rows[0])
    return true
  } catch (error) {
    console.error("Database connection failed:", error)
    return false
  }
}

// 接続プールの状態を取得
export function getPoolStatus() {
  if (!pool) return null
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  }
}

// データベースタイプを取得
export function getDatabaseType(): string {
  return "postgresql"
}

// 汎用クエリ実行関数
export async function executeQuery(sql: string, params: any[] = []): Promise<any> {
  try {
    const result = await query(sql, params)
    return result.rows
  } catch (error) {
    console.error("Query execution failed:", error)
    throw error
  }
}

// Supabaseクライアントの取得（PostgreSQLを使用する場合）
export function getSupabaseClient() {
  // このプロジェクトではPostgreSQLを直接使用しているため、
  // Supabaseクライアントの代わりにPostgreSQLプールを返す
  return getPool()
}
