import { Pool } from "pg"

let pool: Pool | null = null

export function resetPool() {
  if (pool) {
    console.log("Resetting database pool...")
    pool.end().catch(err => console.error("Error closing pool:", err))
    pool = null
  }
}

export function getPool() {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

    if (!databaseUrl) {
      console.error("❌ DATABASE_URL is not set!")
      console.error("Environment variables available:", Object.keys(process.env).filter(k => k.includes('DB') || k.includes('DATABASE')))
      return null
    }

    console.log("✅ Connecting to PostgreSQL:", databaseUrl.replace(/:[^:@]+@/, ':****@'))

    try {
      pool = new Pool({
        connectionString: databaseUrl,
        ssl: false,
        max: 10,
        min: 2,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        allowExitOnIdle: false,
      })

      // 接続エラーのハンドリング
      pool.on('error', (err) => {
        console.error('❌ Unexpected database pool error:', err)
        console.error('Error code:', err.code)
        console.error('Error message:', err.message)
      })

      pool.on('connect', () => {
        console.log('✅ New database connection established')
      })

      pool.on('remove', () => {
        console.log('⚠️ Database connection removed from pool')
      })

      console.log("✅ Database pool created successfully")
    } catch (error) {
      console.error("❌ Failed to create database pool:", error)
      return null
    }
  }

  return pool
}

export async function query(text: string, params?: any[]) {
  let pool = getPool()
  
  if (!pool) {
    console.error("Database pool is not initialized")
    console.error("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not set")
    throw new Error("Database not configured")
  }

  let client;
  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount <= maxRetries) {
    try {
      client = await pool.connect()
      const result = await client.query(text, params)
      return result
    } catch (error: any) {
      console.error(`Database query error (attempt ${retryCount + 1}/${maxRetries + 1}):`, error)
      
      // 接続エラーの場合、プールをリセットして再接続を試みる
      if (retryCount < maxRetries && (error.code === 'ECONNRESET' || error.code === '57P01' || error.message?.includes('Client has encountered a connection error'))) {
        console.log("Connection error detected, resetting pool and retrying...")
        resetPool()
        pool = getPool()
        retryCount++
        await new Promise(resolve => setTimeout(resolve, 1000)) // 1秒待機
        continue
      }
      
      console.error("Query:", text)
      console.error("Params:", params)
      throw error
    } finally {
      if (client) {
        client.release()
      }
    }
  }

  throw new Error("Max retries exceeded")
}

export async function transaction(callback: (client: any) => Promise<any>) {
  const pool = getPool()
  
  if (!pool) {
    throw new Error("Database not configured")
  }
  
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
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (databaseUrl && databaseUrl.startsWith('postgresql://')) {
    return "postgresql"
  }
  return "mock"
}

// データベース情報を取得（実測値）
export async function getDatabaseInfo() {
  try {
    const pool = getPool()
    
    if (!pool) {
      return null
    }
    
    // PostgreSQLバージョン
    const versionResult = await query("SELECT version()")
    
    // データベースサイズ（実測）
    const sizeResult = await query(`
      SELECT pg_database_size(current_database()) as size
    `)
    
    // テーブルサイズの詳細（実測）
    const tableSizeResult = await query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY size_bytes DESC
      LIMIT 10
    `)
    
    // 接続数（実測）
    const connectionsResult = await query(`
      SELECT count(*) as count FROM pg_stat_activity
    `)
    
    // アップタイム（実測）
    const uptimeResult = await query(`
      SELECT EXTRACT(EPOCH FROM (now() - pg_postmaster_start_time())) as uptime
    `)
    
    // ディスク使用率（実測 - データディレクトリのサイズ）
    const diskUsageResult = await query(`
      SELECT 
        pg_database_size(current_database()) as used,
        (SELECT setting::bigint FROM pg_settings WHERE name = 'shared_buffers') * 
        (SELECT setting::bigint FROM pg_settings WHERE name = 'block_size') as allocated
    `)
    
    const version = versionResult.rows[0]?.version || "Unknown"
    const sizeBytes = parseInt(sizeResult.rows[0]?.size || 0)
    const connections = connectionsResult.rows[0]?.count || 0
    const uptimeSeconds = uptimeResult.rows[0]?.uptime || 0
    const diskUsed = parseInt(diskUsageResult.rows[0]?.used || 0)
    const diskAllocated = parseInt(diskUsageResult.rows[0]?.allocated || 0)
    
    // バージョン文字列からPostgreSQLバージョン番号を抽出
    const versionMatch = version.match(/PostgreSQL (\d+\.\d+)/)
    const postgresVersion = versionMatch ? `PostgreSQL ${versionMatch[1]}` : "PostgreSQL"
    
    // アップタイムをフォーマット
    const days = Math.floor(uptimeSeconds / 86400)
    const hours = Math.floor((uptimeSeconds % 86400) / 3600)
    const minutes = Math.floor((uptimeSeconds % 3600) / 60)
    const uptime = `${days}日 ${hours}時間 ${minutes}分`
    
    // サイズをGB/MB単位に変換
    const sizeGB = (sizeBytes / (1024 * 1024 * 1024))
    const sizeMB = (sizeBytes / (1024 * 1024))
    const sizeFormatted = sizeGB >= 1 ? `${sizeGB.toFixed(2)} GB` : `${sizeMB.toFixed(2)} MB`
    
    // ディスク使用率を計算
    const diskUsagePercent = diskAllocated > 0 ? 
      Math.min(100, ((diskUsed / diskAllocated) * 100)) : 0
    
    return {
      version: postgresVersion,
      size: sizeFormatted,
      sizeBytes: sizeBytes,
      connections: parseInt(connections),
      uptime,
      diskUsagePercent: diskUsagePercent.toFixed(1),
      tableSizes: tableSizeResult.rows.map((row: any) => ({
        schema: row.schemaname,
        table: row.tablename,
        size: row.size,
        sizeBytes: parseInt(row.size_bytes)
      }))
    }
  } catch (error) {
    console.error("Failed to get database info:", error)
    return null
  }
}

// app_resource_routingのキャッシュ
interface ResourceRouting {
  logical_resource_name: string
  physical_schema: string
  physical_table: string
}

let resourceRoutingCache: Map<string, ResourceRouting> | null = null
let routingCacheLoadTime: number | null = null
const CACHE_TTL = 60000 // 60秒

// app_resource_routingからルーティング情報を読み込み
async function loadResourceRouting(): Promise<void> {
  try {
    const pool = getPool()
    if (!pool) {
      console.warn('⚠️ Database pool not available, using fallback routing')
      return
    }

    // キャッシュが有効な場合はスキップ
    const now = Date.now()
    if (resourceRoutingCache && routingCacheLoadTime && (now - routingCacheLoadTime) < CACHE_TTL) {
      return
    }

    console.log('📋 Loading resource routing from app_resource_routing...')
    const result = await query(
      'SELECT logical_resource_name, physical_schema, physical_table FROM public.app_resource_routing WHERE is_active = true'
    )
    
    resourceRoutingCache = new Map()
    for (const row of result.rows) {
      resourceRoutingCache.set(row.logical_resource_name, {
        logical_resource_name: row.logical_resource_name,
        physical_schema: row.physical_schema,
        physical_table: row.physical_table,
      })
    }
    
    routingCacheLoadTime = now
    console.log(`✅ Loaded ${resourceRoutingCache.size} resource routes`)
  } catch (error) {
    console.error('❌ Failed to load resource routing:', error)
    // エラーの場合はフォールバックマッピングを使用
  }
}

// リソース名からスキーマとテーブルを解決
export async function resolveResource(logicalResourceName: string): Promise<{ schema: string; table: string }> {
  // ルーティング情報を読み込み（初回またはキャッシュ期限切れの場合）
  await loadResourceRouting()
  
  // キャッシュから検索
  if (resourceRoutingCache?.has(logicalResourceName)) {
    const routing = resourceRoutingCache.get(logicalResourceName)!
    return {
      schema: routing.physical_schema,
      table: routing.physical_table,
    }
  }
  
  // フォールバック: ハードコードされたマッピング
  return getSchemaForTableFallback(logicalResourceName)
}

// フォールバック用のテーブル名からスキーマを自動判定
function getSchemaForTableFallback(tableName: string): { schema: string; table: string } {
  const tableSchemaMap: Record<string, string> = {
    // master_data スキーマ
    'managements_offices': 'master_data',
    'bases': 'master_data',
    'machine_types': 'master_data',
    'machine-types': 'master_data', // ハイフン形式もサポート
    'machines': 'master_data',
    'vehicles': 'master_data',
    'inspection_types': 'master_data',
    
    // operations スキーマ
    'operation_plans': 'operations',
    'operation_records': 'operations',
    'travel_plans': 'operations',
    'travel_records': 'operations',
    
    // inspections スキーマ
    'inspection_plans': 'inspections',
    'inspections': 'inspections',
    'maintenance_cycles': 'inspections',
    
    // maintenance スキーマ
    'failures': 'maintenance',
    'repairs': 'maintenance',
    'monthly_maintenance_plans': 'maintenance',
  }
  
  const schema = tableSchemaMap[tableName] || 'public'
  // テーブル名はハイフンをアンダースコアに変換
  const physicalTable = tableName.replace(/-/g, '_')
  
  return { schema, table: physicalTable }
}

// テーブル名からスキーマを自動判定（後方互換性のため残す）
function getSchemaForTable(tableName: string): string {
  const { schema } = getSchemaForTableFallback(tableName)
  return schema
}

// SQLクエリにスキーマプレフィックスを自動追加
function addSchemaPrefix(sql: string): string {
  // すでにスキーマプレフィックスがある場合はそのまま返す
  if (sql.match(/\b(master_data|operations|inspections|maintenance|public|information_schema)\./) ) {
    return sql
  }
  
  // テーブル名を検出してスキーマプレフィックスを追加
  const tablePattern = /\b(FROM|JOIN|INTO|UPDATE|TABLE)\s+([a-z_]+)/gi
  const modifiedSql = sql.replace(tablePattern, (match, keyword, tableName) => {
    const schema = getSchemaForTable(tableName.toLowerCase())
    return `${keyword} ${schema}.${tableName}`
  })
  
  return modifiedSql
}

// 汎用クエリ実行関数
export async function executeQuery(sql: string, params: any[] = []): Promise<any> {
  try {
    // スキーマプレフィックスを自動追加
    const modifiedSql = addSchemaPrefix(sql)
    console.log("Executing query:", modifiedSql, "with params:", params)
    
    // プールが初期化されているか確認
    const pool = getPool()
    if (!pool) {
      console.error("❌ Database pool is null!")
      throw new Error("Database connection is not available")
    }
    
    const result = await query(modifiedSql, params)
    console.log("Query result:", result.rows.length, "rows")
    return result.rows
  } catch (error) {
    console.error("❌ Query execution failed:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any).code,
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

// Supabaseクライアントの取得（PostgreSQLを使用する場合）
export function getSupabaseClient() {
  // データベースが設定されていない場合はnullを返す
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!databaseUrl) {
    return null
  }
  
  // このプロジェクトではPostgreSQLを直接使用しているため、
  // Supabaseクライアントの代わりにPostgreSQLプールを返す
  return getPool()
}
