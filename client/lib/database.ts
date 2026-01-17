import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDatabaseType() { return "postgresql"; }
export function getSupabaseClient() { return null; }

export async function executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_PRODUCTION;
    if (!databaseUrl) throw new Error("DATABASE_URL is missing");

    // NODE_ENVがdevelopment、またはDB_SSL_ENABLEDがfalseの場合はSSLを無効にする
    const isLocal = process.env.NODE_ENV === 'development' || databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
    const sslEnabled = process.env.DB_SSL_ENABLED !== 'false' && !isLocal;

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: sslEnabled ? { rejectUnauthorized: false } : false
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    pool.on('connect', async (client) => {
      try {
        await client.query("SET search_path TO master_data, operations, inspections, maintenance, public");
      } catch (err) {
        console.error('Error setting search_path:', err);
      }
    });
  }
  const client = await pool.connect();
  try {
    const res = await client.query(query, params);
    return res.rows;
  } finally {
    client.release();
  }
}