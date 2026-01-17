import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDatabaseType() {
  return "postgresql";
}

export function getSupabaseClient() {
  return null as any;
}

export async function executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_PRODUCTION;
    
    if (!databaseUrl) {
      console.error("DATABASE_URL is not set!");
      throw new Error("Database configuration missing");
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1') ? false : {
        rejectUnauthorized: false
      }
    });

    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });

    pool.on('connect', async (client) => {
      try {
        await client.query('SET search_path TO master_data, operations, inspections, maintenance, public');
      } catch (err) {
        console.error('Failed to set search_path:', err);
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
