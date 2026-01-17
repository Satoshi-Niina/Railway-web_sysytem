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
    // サーバ�Eサイドでのみ環墁E��数を�E読み込み
    if (!process.env.DATABASE_URL) {
      try {
        const fs = require('fs');
        const path = require('path');
        const dotenv = require('dotenv');
        
        // プロジェクトルート�E.env.developmentを探ぁE        // Next.jsのビルド時はclient/がカレントディレクトリ
        const possiblePaths = [
          path.resolve(process.cwd(), '../.env.development'),  // clientから一つ丁E          path.resolve(process.cwd(), '.env.development'),    // ルートディレクトリ
        ];
        
        for (const envPath of possiblePaths) {
          if (fs.existsSync(envPath)) {
            console.log("✁ELoading environment variables from:", envPath);
            dotenv.config({ path: envPath });
            break;
          }
        }
      } catch (e) {
        console.error("⚠�E�EFailed to load .env.development:", e)
      }
    }

    const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

    if (!databaseUrl) {
      console.error("❁EDATABASE_URL is not set!")
      return null
    }

    console.log("✁EConnecting to PostgreSQL:", databaseUrl.replace(/:[^:@]+@/, ':****@'))

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
        console.error('❁EUnexpected database pool error:', err)
        console.error('Error code:', err.code)
        console.error('Error message:', err.message)
      })

      pool.on('connect', async (client) => {
        console.log('✁ENew database connection established')
        // 接続時にsearch_pathを設宁E        try {
          await client.query('SET search_path TO master_data, operations, inspections, maintenance, public')
          console.log('✁Esearch_path set to: master_data, operations, inspections, maintenance, public')
        } catch (err) {
          console.error('⚠�E�EFailed to set search_path:', err)
        }
      })

      pool.on('remove', () => {
        console.log('⚠�E�EDatabase connection removed from pool')
      })

      console.log("✁EDatabase pool created successfully")
    } catch (error) {
      console.error("❁EFailed to create database pool:", error)
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
      
      // 接続エラーの場合、�EールをリセチE��して再接続を試みめE      if (retryCount < maxRetries && (error.code === 'ECONNRESET' || error.code === '57P01' || error.message?.includes('Client has encountered a connection error'))) {
        console.log("Connection error detected, resetting pool and retrying...")
        resetPool()
        pool = getPool()
        retryCount++
        await new Promise(resolve => setTimeout(resolve, 1000)) // 1秒征E��E        continue
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

// チE�Eタベ�Eス接続テスチEexport async function testConnection() {
  try {
    const result = await query("SELECT NOW()")
    console.log("Database connection successful:", result.rows[0])
    return true
  } catch (error) {
    console.error("Database connection failed:", error)
    return false
  }
}

// 接続�Eールの状態を取征Eexport function getPoolStatus() {
  if (!pool) return null
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  }
}

// チE�Eタベ�Eスタイプを取征Eexport function getDatabaseType(): string {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (databaseUrl && databaseUrl.startsWith('postgresql://')) {
    return "postgresql"
  }
  return "mock"
}

// チE�Eタベ�Eス惁E��を取得（実測値�E�Eexport async function getDatabaseInfo() {
  try {
    const pool = getPool()
    
    if (!pool) {
      return null
    }
    
    // PostgreSQLバ�Eジョン
    const versionResult = await query("SELECT version()")
    
    // チE�Eタベ�Eスサイズ�E�実測�E�E    const sizeResult = await query(`
      SELECT pg_database_size(current_database()) as size
    `)
    
    // チE�Eブルサイズの詳細�E�実測�E�E    const tableSizeResult = await query(`
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
    
    // 接続数�E�実測�E�E    const connectionsResult = await query(`
      SELECT count(*) as count FROM pg_stat_activity
    `)
    
    // アチE�Eタイム�E�実測�E�E    const uptimeResult = await query(`
      SELECT EXTRACT(EPOCH FROM (now() - pg_postmaster_start_time())) as uptime
    `)
    
    // チE��スク使用玁E��実測 - チE�EタチE��レクトリのサイズ�E�E    const diskUsageResult = await query(`
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
    
    // バ�Eジョン斁E���EからPostgreSQLバ�Eジョン番号を抽出
    const versionMatch = version.match(/PostgreSQL (\d+\.\d+)/)
    const postgresVersion = versionMatch ? `PostgreSQL ${versionMatch[1]}` : "PostgreSQL"
    
    // アチE�EタイムをフォーマッチE    const days = Math.floor(uptimeSeconds / 86400)
    const hours = Math.floor((uptimeSeconds % 86400) / 3600)
    const minutes = Math.floor((uptimeSeconds % 3600) / 60)
    const uptime = `${days}日 ${hours}時間 ${minutes}刁E
    
    // サイズをGB/MB単位に変換
    const sizeGB = (sizeBytes / (1024 * 1024 * 1024))
    const sizeMB = (sizeBytes / (1024 * 1024))
    const sizeFormatted = sizeGB >= 1 ? `${sizeGB.toFixed(2)} GB` : `${sizeMB.toFixed(2)} MB`
    
    // チE��スク使用玁E��計箁E    const diskUsagePercent = diskAllocated > 0 ? 
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

// app_resource_routingのキャチE��ュ
interface ResourceRouting {
  logical_resource_name: string
  physical_schema: string
  physical_table: string
}

let resourceRoutingCache: Map<string, ResourceRouting> | null = null
let routingCacheLoadTime: number | null = null
const CACHE_TTL = 60000 // 60私E
// app_resource_routingからルーチE��ング惁E��を読み込み
async function loadResourceRouting(): Promise<void> {
  try {
    const pool = getPool()
    if (!pool) {
      console.warn('⚠�E�EDatabase pool not available, using fallback routing')
      return
    }

    // キャチE��ュが有効な場合�EスキチE�E
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
    console.log(`✁ELoaded ${resourceRoutingCache.size} resource routes`)
  } catch (error) {
    console.error('❁EFailed to load resource routing:', error)
    // エラーの場合�Eフォールバックマッピングを使用
  }
}

// リソース名からスキーマとチE�Eブルを解決
export async function resolveResource(logicalResourceName: string): Promise<{ schema: string; table: string }> {
  // ルーチE��ング惁E��を読み込み�E��E回また�EキャチE��ュ期限刁E��の場合！E  await loadResourceRouting()
  
  // キャチE��ュから検索
  if (resourceRoutingCache?.has(logicalResourceName)) {
    const routing = resourceRoutingCache.get(logicalResourceName)!
    return {
      schema: routing.physical_schema,
      table: routing.physical_table,
    }
  }
  
  // フォールバック: ハ�Eドコードされたマッピング
  return getSchemaForTableFallback(logicalResourceName)
}

// フォールバック用のチE�Eブル名からスキーマを自動判宁Efunction getSchemaForTableFallback(tableName: string): { schema: string; table: string } {
  const tableSchemaMap: Record<string, string> = {
    // master_data スキーチE    'managements_offices': 'master_data',
    'managements_offices': 'master_data',
    'bases': 'master_data',
    'machine_types': 'master_data',
    'machine-types': 'master_data', // ハイフン形式もサポ�EチE    'machines': 'master_data',
    'vehicles': 'master_data',
    'vehicle_types': 'master_data',
    'inspection_types': 'master_data',
    'maintenance_base_dates': 'master_data',
    'maintenance_plans': 'master_data',
    'inspection_schedules': 'master_data',
    'vehicle_inspection_schedules': 'master_data',
    
    // operations スキーチE    'operation_plans': 'operations',
    'operation_records': 'operations',
    'travel_plans': 'operations',
    'travel_records': 'operations',
    
    // inspections スキーチE    'inspection_plans': 'inspections',
    'inspections': 'inspections',
    'maintenance_cycles': 'inspections',
    'vehicle_inspection_records': 'inspections',
    'inspection_cycle_order': 'inspections',
    
    // maintenance スキーチE    'failures': 'maintenance',
    'repairs': 'maintenance',
    'monthly_maintenance_plans': 'maintenance',
  }
  
  // チE�Eブル名エイリアス�E�実際のDBチE�Eブル名への変換�E�E  const tableNameAlias: Record<string, string> = {
    'managements_offices': 'managements_offices',
  }
  
  const actualTableName = tableNameAlias[tableName] || tableName
  const schema = tableSchemaMap[tableName] || tableSchemaMap[actualTableName] || 'public'
  // チE�Eブル名�Eハイフンをアンダースコアに変換
  const physicalTable = actualTableName.replace(/-/g, '_')
  
  return { schema, table: physicalTable }
}

// チE�Eブル名からスキーマを自動判定（後方互換性のため残す�E�Efunction getSchemaForTable(tableName: string): string {
  const { schema } = getSchemaForTableFallback(tableName)
  return schema
}

// SQLクエリにスキーマ�EレフィチE��スを�E動追加
function addSchemaPrefix(sql: string): string {
  // すでにスキーマ�EレフィチE��スがある場合�Eそ�Eまま返す
  if (sql.match(/\b(master_data|operations|inspections|maintenance|public|information_schema)\./) ) {
    return sql
  }
  
  // チE�Eブル名を検�Eしてスキーマ�EレフィチE��スを追加
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
    // スキーマ�EレフィチE��スを�E動追加
    const modifiedSql = addSchemaPrefix(sql)
    console.log("Executing query:", modifiedSql, "with params:", params)
    
    // プ�Eルが�E期化されてぁE��か確誁E    const pool = getPool()
    if (!pool) {
      console.error("❁EDatabase pool is null!")
      throw new Error("Database connection is not available")
    }
    
    const result = await query(modifiedSql, params)
    console.log("Query result:", result.rows.length, "rows")
    return result.rows
  } catch (error) {
    console.error("❁EQuery execution failed:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any).code,
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

// Supabaseクライアント�E取得！EostgreSQLを使用する場合！Eexport function getSupabaseClient() {
  // チE�Eタベ�Eスが設定されてぁE��ぁE��合�Enullを返す
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!databaseUrl) {
    return null
  }
  
  // こ�EプロジェクトではPostgreSQLを直接使用してぁE��ため、E  // Supabaseクライアント�E代わりにPostgreSQLプ�Eルを返す
  return getPool()
}
