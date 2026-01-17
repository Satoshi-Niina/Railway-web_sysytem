import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDatabaseType() { return "postgresql"; }
export function getSupabaseClient() { return null; }

export async function executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_PRODUCTION;
    if (!databaseUrl) throw new Error("DATABASE_URL is missing");
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    pool.on('connect', async (client) => {
      await client.query("SET search_path TO master_data, operations, inspections, maintenance, public");
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