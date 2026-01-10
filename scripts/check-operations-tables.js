import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkOperationsTables() {
  try {
    console.log('=== Checking operations schema tables ===\n');

    // operations スキーマのテーブル一覧
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'operations'
      ORDER BY table_name
    `);

    console.log('Tables in operations schema:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // operation_records テーブルの列を確認
    if (tablesResult.rows.some(row => row.table_name === 'operation_records')) {
      console.log('\n=== operation_records table columns ===');
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'operations' AND table_name = 'operation_records'
        ORDER BY ordinal_position
      `);
      
      columnsResult.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });

      // サンプルデータを確認
      const sampleResult = await pool.query(`
        SELECT COUNT(*) as count FROM operations.operation_records
      `);
      console.log(`\nTotal records: ${sampleResult.rows[0].count}`);
    }

    // operation_plans テーブルの存在確認
    const planExists = tablesResult.rows.some(row => row.table_name === 'operation_plans');
    console.log(`\n=== operation_plans table exists: ${planExists} ===`);

    if (!planExists) {
      console.log('\n⚠️  operation_plans table does not exist!');
      console.log('Creating operation_plans table...\n');
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS operations.operation_plans (
          id SERIAL PRIMARY KEY,
          vehicle_id TEXT NOT NULL,
          plan_date DATE NOT NULL,
          end_date DATE,
          shift_type TEXT DEFAULT 'day',
          start_time TIME,
          end_time TIME,
          planned_distance NUMERIC DEFAULT 0,
          departure_base_id TEXT,
          arrival_base_id TEXT,
          notes TEXT,
          status TEXT DEFAULT 'planned',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ operation_plans table created successfully!');
      
      // インデックスを作成
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_operation_plans_vehicle_id 
        ON operations.operation_plans(vehicle_id)
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_operation_plans_plan_date 
        ON operations.operation_plans(plan_date)
      `);
      
      console.log('✅ Indexes created successfully!');
    } else {
      console.log('\n✅ operation_plans table already exists!');
      
      // 列の確認
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'operations' AND table_name = 'operation_plans'
        ORDER BY ordinal_position
      `);
      
      console.log('\noperation_plans table columns:');
      columnsResult.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Details:', error);
  } finally {
    await pool.end();
  }
}

checkOperationsTables();
