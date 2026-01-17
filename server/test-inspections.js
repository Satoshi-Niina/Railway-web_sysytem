import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.development') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function test() {
  try {
    await client.connect();
    
    console.log('=== 運用実績データ確認 ===');
    
    // 1. operation_records の全データ確認
    const allRecords = await client.query(`
      SELECT record_id, vehicle_id, operation_date, status, shift_type, departure_base_id, arrival_base_id
      FROM operations.operation_records
      ORDER BY operation_date DESC
    `);
    console.log('全運用実績件数:', allRecords.rows.length);
    console.log(JSON.stringify(allRecords.rows, null, 2));
    
    // 2. vehicle_idマッピング確認
    console.log('\n=== vehicles テーブル ===');
    const vehicles = await client.query(`
      SELECT vehicle_id, registration_number, machine_id
      FROM master_data.vehicles
      ORDER BY vehicle_id
    `);
    console.log(JSON.stringify(vehicles.rows, null, 2));
    
    // 3. フロントエンドが取得するクエリを再現
    console.log('\n=== フロントエンドと同じクエリ (月: 2026-02) ===');
    const frontendQuery = await client.query(`
      SELECT 
        record_id, 
        schedule_id,
        vehicle_id, 
        operation_date, 
        start_time, 
        end_time, 
        actual_start_time,
        actual_end_time,
        actual_distance,
        departure_base_id,
        arrival_base_id,
        is_as_planned,
        status, 
        notes, 
        created_at, 
        updated_at
      FROM operations.operation_records
      WHERE operation_date >= '2026-02-01' AND operation_date < ('2026-02-01'::date + interval '1 month')
      ORDER BY operation_date, start_time
    `);
    console.log('取得件数:', frontendQuery.rows.length);
    console.log(JSON.stringify(frontendQuery.rows, null, 2));
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

test();
