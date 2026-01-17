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
    // 繧ｵ繝ｼ繝舌・繧ｵ繧､繝峨〒縺ｮ縺ｿ迺ｰ蠅・､画焚繧貞・隱ｭ縺ｿ霎ｼ縺ｿ
    if (!process.env.DATABASE_URL) {
      try {
        const fs = require('fs');
        const path = require('path');
        const dotenv = require('dotenv');
        
        // 繝励Ο繧ｸ繧ｧ繧ｯ繝医Ν繝ｼ繝医・.env.development繧呈爾縺・        // Next.js縺ｮ繝薙Ν繝画凾縺ｯclient/縺後き繝ｬ繝ｳ繝医ョ繧｣繝ｬ繧ｯ繝医Μ
        const possiblePaths = [
          path.resolve(process.cwd(), '../.env.development'),  // client縺九ｉ荳縺､荳・          path.resolve(process.cwd(), '.env.development'),    // 繝ｫ繝ｼ繝医ョ繧｣繝ｬ繧ｯ繝医Μ
        ];
        
        for (const envPath of possiblePaths) {
          if (fs.existsSync(envPath)) {
            console.log("笨・Loading environment variables from:", envPath);
            dotenv.config({ path: envPath });
            break;
          }
        }
      } catch (e) {
        console.error("笞・・Failed to load .env.development:", e)
      }
    }

    const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

    if (!databaseUrl) {
      console.error("笶・DATABASE_URL is not set!")
      return null
    }

    console.log("笨・Connecting to PostgreSQL:", databaseUrl.replace(/:[^:@]+@/, ':****@'))

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

      // 謗･邯壹お繝ｩ繝ｼ縺ｮ繝上Φ繝峨Μ繝ｳ繧ｰ
      pool.on('error', (err) => {
        console.error('笶・Unexpected database pool error:', err)
        console.error('Error code:', err.code)
        console.error('Error message:', err.message)
      })

      pool.on('connect', async (client) => {
        console.log('笨・New database connection established')
        // 謗･邯壽凾縺ｫsearch_path繧定ｨｭ螳・        try {
          await client.query('SET search_path TO master_data, operations, inspections, maintenance, public')
          console.log('笨・search_path set to: master_data, operations, inspections, maintenance, public')
        } catch (err) {
          console.error('笞・・Failed to set search_path:', err)
        }
      })

      pool.on('remove', () => {
        console.log('笞・・Database connection removed from pool')
      })

      console.log("笨・Database pool created successfully")
    } catch (error) {
      console.error("笶・Failed to create database pool:", error)
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
      
      // 謗･邯壹お繝ｩ繝ｼ縺ｮ蝣ｴ蜷医√・繝ｼ繝ｫ繧偵Μ繧ｻ繝・ヨ縺励※蜀肴磁邯壹ｒ隧ｦ縺ｿ繧・      if (retryCount < maxRetries && (error.code === 'ECONNRESET' || error.code === '57P01' || error.message?.includes('Client has encountered a connection error'))) {
        console.log("Connection error detected, resetting pool and retrying...")
        resetPool()
        pool = getPool()
        retryCount++
        await new Promise(resolve => setTimeout(resolve, 1000)) // 1遘貞ｾ・ｩ・        continue
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

// 繝・・繧ｿ繝吶・繧ｹ謗･邯壹ユ繧ｹ繝・export async function testConnection() {
  try {
    const result = await query("SELECT NOW()")
    console.log("Database connection successful:", result.rows[0])
    return true
  } catch (error) {
    console.error("Database connection failed:", error)
    return false
  }
}

// 謗･邯壹・繝ｼ繝ｫ縺ｮ迥ｶ諷九ｒ蜿門ｾ・export function getPoolStatus() {
  if (!pool) return null
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  }
}

// 繝・・繧ｿ繝吶・繧ｹ繧ｿ繧､繝励ｒ蜿門ｾ・export function getDatabaseType(): string {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (databaseUrl && databaseUrl.startsWith('postgresql://')) {
    return "postgresql"
  }
  return "mock"
}

// 繝・・繧ｿ繝吶・繧ｹ諠・ｱ繧貞叙蠕暦ｼ亥ｮ滓ｸｬ蛟､・・export async function getDatabaseInfo() {
  try {
    const pool = getPool()
    
    if (!pool) {
      return null
    }
    
    // PostgreSQL繝舌・繧ｸ繝ｧ繝ｳ
    const versionResult = await query("SELECT version()")
    
    // 繝・・繧ｿ繝吶・繧ｹ繧ｵ繧､繧ｺ・亥ｮ滓ｸｬ・・    const sizeResult = await query(`
      SELECT pg_database_size(current_database()) as size
    `)
    
    // 繝・・繝悶Ν繧ｵ繧､繧ｺ縺ｮ隧ｳ邏ｰ・亥ｮ滓ｸｬ・・    const tableSizeResult = await query(`
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
    
    // 謗･邯壽焚・亥ｮ滓ｸｬ・・    const connectionsResult = await query(`
      SELECT count(*) as count FROM pg_stat_activity
    `)
    
    // 繧｢繝・・繧ｿ繧､繝・亥ｮ滓ｸｬ・・    const uptimeResult = await query(`
      SELECT EXTRACT(EPOCH FROM (now() - pg_postmaster_start_time())) as uptime
    `)
    
    // 繝・ぅ繧ｹ繧ｯ菴ｿ逕ｨ邇・ｼ亥ｮ滓ｸｬ - 繝・・繧ｿ繝・ぅ繝ｬ繧ｯ繝医Μ縺ｮ繧ｵ繧､繧ｺ・・    const diskUsageResult = await query(`
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
    
    // 繝舌・繧ｸ繝ｧ繝ｳ譁・ｭ怜・縺九ｉPostgreSQL繝舌・繧ｸ繝ｧ繝ｳ逡ｪ蜿ｷ繧呈歓蜃ｺ
    const versionMatch = version.match(/PostgreSQL (\d+\.\d+)/)
    const postgresVersion = versionMatch ? `PostgreSQL ${versionMatch[1]}` : "PostgreSQL"
    
    // 繧｢繝・・繧ｿ繧､繝繧偵ヵ繧ｩ繝ｼ繝槭ャ繝・    const days = Math.floor(uptimeSeconds / 86400)
    const hours = Math.floor((uptimeSeconds % 86400) / 3600)
    const minutes = Math.floor((uptimeSeconds % 3600) / 60)
    const uptime = `${days}譌･ ${hours}譎る俣 ${minutes}蛻・
    
    // 繧ｵ繧､繧ｺ繧竪B/MB蜊倅ｽ阪↓螟画鋤
    const sizeGB = (sizeBytes / (1024 * 1024 * 1024))
    const sizeMB = (sizeBytes / (1024 * 1024))
    const sizeFormatted = sizeGB >= 1 ? `${sizeGB.toFixed(2)} GB` : `${sizeMB.toFixed(2)} MB`
    
    // 繝・ぅ繧ｹ繧ｯ菴ｿ逕ｨ邇・ｒ險育ｮ・    const diskUsagePercent = diskAllocated > 0 ? 
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

// app_resource_routing縺ｮ繧ｭ繝｣繝・す繝･
interface ResourceRouting {
  logical_resource_name: string
  physical_schema: string
  physical_table: string
}

let resourceRoutingCache: Map<string, ResourceRouting> | null = null
let routingCacheLoadTime: number | null = null
const CACHE_TTL = 60000 // 60遘・
// app_resource_routing縺九ｉ繝ｫ繝ｼ繝・ぅ繝ｳ繧ｰ諠・ｱ繧定ｪｭ縺ｿ霎ｼ縺ｿ
async function loadResourceRouting(): Promise<void> {
  try {
    const pool = getPool()
    if (!pool) {
      console.warn('笞・・Database pool not available, using fallback routing')
      return
    }

    // 繧ｭ繝｣繝・す繝･縺梧怏蜉ｹ縺ｪ蝣ｴ蜷医・繧ｹ繧ｭ繝・・
    const now = Date.now()
    if (resourceRoutingCache && routingCacheLoadTime && (now - routingCacheLoadTime) < CACHE_TTL) {
      return
    }

    console.log('搭 Loading resource routing from app_resource_routing...')
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
    console.log(`笨・Loaded ${resourceRoutingCache.size} resource routes`)
  } catch (error) {
    console.error('笶・Failed to load resource routing:', error)
    // 繧ｨ繝ｩ繝ｼ縺ｮ蝣ｴ蜷医・繝輔か繝ｼ繝ｫ繝舌ャ繧ｯ繝槭ャ繝斐Φ繧ｰ繧剃ｽｿ逕ｨ
  }
}

// 繝ｪ繧ｽ繝ｼ繧ｹ蜷阪°繧峨せ繧ｭ繝ｼ繝槭→繝・・繝悶Ν繧定ｧ｣豎ｺ
export async function resolveResource(logicalResourceName: string): Promise<{ schema: string; table: string }> {
  // 繝ｫ繝ｼ繝・ぅ繝ｳ繧ｰ諠・ｱ繧定ｪｭ縺ｿ霎ｼ縺ｿ・亥・蝗槭∪縺溘・繧ｭ繝｣繝・す繝･譛滄剞蛻・ｌ縺ｮ蝣ｴ蜷茨ｼ・  await loadResourceRouting()
  
  // 繧ｭ繝｣繝・す繝･縺九ｉ讀懃ｴ｢
  if (resourceRoutingCache?.has(logicalResourceName)) {
    const routing = resourceRoutingCache.get(logicalResourceName)!
    return {
      schema: routing.physical_schema,
      table: routing.physical_table,
    }
  }
  
  // 繝輔か繝ｼ繝ｫ繝舌ャ繧ｯ: 繝上・繝峨さ繝ｼ繝峨＆繧後◆繝槭ャ繝斐Φ繧ｰ
  return getSchemaForTableFallback(logicalResourceName)
}

// 繝輔か繝ｼ繝ｫ繝舌ャ繧ｯ逕ｨ縺ｮ繝・・繝悶Ν蜷阪°繧峨せ繧ｭ繝ｼ繝槭ｒ閾ｪ蜍募愛螳・function getSchemaForTableFallback(tableName: string): { schema: string; table: string } {
  const tableSchemaMap: Record<string, string> = {
    // master_data 繧ｹ繧ｭ繝ｼ繝・    'managements_offices': 'master_data',
    'managements_offices': 'master_data',
    'bases': 'master_data',
    'machine_types': 'master_data',
    'machine-types': 'master_data', // 繝上う繝輔Φ蠖｢蠑上ｂ繧ｵ繝昴・繝・    'machines': 'master_data',
    'vehicles': 'master_data',
    'vehicle_types': 'master_data',
    'inspection_types': 'master_data',
    'maintenance_base_dates': 'master_data',
    'maintenance_plans': 'master_data',
    'inspection_schedules': 'master_data',
    'vehicle_inspection_schedules': 'master_data',
    
    // operations 繧ｹ繧ｭ繝ｼ繝・    'operation_plans': 'operations',
    'operation_records': 'operations',
    'travel_plans': 'operations',
    'travel_records': 'operations',
    
    // inspections 繧ｹ繧ｭ繝ｼ繝・    'inspection_plans': 'inspections',
    'inspections': 'inspections',
    'maintenance_cycles': 'inspections',
    'vehicle_inspection_records': 'inspections',
    'inspection_cycle_order': 'inspections',
    
    // maintenance 繧ｹ繧ｭ繝ｼ繝・    'failures': 'maintenance',
    'repairs': 'maintenance',
    'monthly_maintenance_plans': 'maintenance',
  }
  
  // 繝・・繝悶Ν蜷阪お繧､繝ｪ繧｢繧ｹ・亥ｮ滄圀縺ｮDB繝・・繝悶Ν蜷阪∈縺ｮ螟画鋤・・  const tableNameAlias: Record<string, string> = {
    'managements_offices': 'managements_offices',
  }
  
  const actualTableName = tableNameAlias[tableName] || tableName
  const schema = tableSchemaMap[tableName] || tableSchemaMap[actualTableName] || 'public'
  // 繝・・繝悶Ν蜷阪・繝上う繝輔Φ繧偵い繝ｳ繝繝ｼ繧ｹ繧ｳ繧｢縺ｫ螟画鋤
  const physicalTable = actualTableName.replace(/-/g, '_')
  
  return { schema, table: physicalTable }
}

// 繝・・繝悶Ν蜷阪°繧峨せ繧ｭ繝ｼ繝槭ｒ閾ｪ蜍募愛螳夲ｼ亥ｾ梧婿莠呈鋤諤ｧ縺ｮ縺溘ａ谿九☆・・function getSchemaForTable(tableName: string): string {
  const { schema } = getSchemaForTableFallback(tableName)
  return schema
}

// SQL繧ｯ繧ｨ繝ｪ縺ｫ繧ｹ繧ｭ繝ｼ繝槭・繝ｬ繝輔ぅ繝・け繧ｹ繧定・蜍戊ｿｽ蜉
function addSchemaPrefix(sql: string): string {
  // 縺吶〒縺ｫ繧ｹ繧ｭ繝ｼ繝槭・繝ｬ繝輔ぅ繝・け繧ｹ縺後≠繧句ｴ蜷医・縺昴・縺ｾ縺ｾ霑斐☆
  if (sql.match(/\b(master_data|operations|inspections|maintenance|public|information_schema)\./) ) {
    return sql
  }
  
  // 繝・・繝悶Ν蜷阪ｒ讀懷・縺励※繧ｹ繧ｭ繝ｼ繝槭・繝ｬ繝輔ぅ繝・け繧ｹ繧定ｿｽ蜉
  const tablePattern = /\b(FROM|JOIN|INTO|UPDATE|TABLE)\s+([a-z_]+)/gi
  const modifiedSql = sql.replace(tablePattern, (match, keyword, tableName) => {
    const schema = getSchemaForTable(tableName.toLowerCase())
    return `${keyword} ${schema}.${tableName}`
  })
  
  return modifiedSql
}

// 豎守畑繧ｯ繧ｨ繝ｪ螳溯｡碁未謨ｰ
export async function executeQuery(sql: string, params: any[] = []): Promise<any> {
  try {
    // 繧ｹ繧ｭ繝ｼ繝槭・繝ｬ繝輔ぅ繝・け繧ｹ繧定・蜍戊ｿｽ蜉
    const modifiedSql = addSchemaPrefix(sql)
    console.log("Executing query:", modifiedSql, "with params:", params)
    
    // 繝励・繝ｫ縺悟・譛溷喧縺輔ｌ縺ｦ縺・ｋ縺狗｢ｺ隱・    const pool = getPool()
    if (!pool) {
      console.error("笶・Database pool is null!")
      throw new Error("Database connection is not available")
    }
    
    const result = await query(modifiedSql, params)
    console.log("Query result:", result.rows.length, "rows")
    return result.rows
  } catch (error) {
    console.error("笶・Query execution failed:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any).code,
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

// Supabase繧ｯ繝ｩ繧､繧｢繝ｳ繝医・蜿門ｾ暦ｼ・ostgreSQL繧剃ｽｿ逕ｨ縺吶ｋ蝣ｴ蜷茨ｼ・export function getSupabaseClient() {
  // 繝・・繧ｿ繝吶・繧ｹ縺瑚ｨｭ螳壹＆繧後※縺・↑縺・ｴ蜷医・null繧定ｿ斐☆
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!databaseUrl) {
    return null
  }
  
  // 縺薙・繝励Ο繧ｸ繧ｧ繧ｯ繝医〒縺ｯPostgreSQL繧堤峩謗･菴ｿ逕ｨ縺励※縺・ｋ縺溘ａ縲・  // Supabase繧ｯ繝ｩ繧､繧｢繝ｳ繝医・莉｣繧上ｊ縺ｫPostgreSQL繝励・繝ｫ繧定ｿ斐☆
  return getPool()
}
