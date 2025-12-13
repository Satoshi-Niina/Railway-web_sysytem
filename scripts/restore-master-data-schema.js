// master_dataスキーマを復元し、不要なスキーマを削除するスクリプト
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dotenv from 'dotenv';
dotenv.config();

// データベース接続設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/webappdb',
  ssl: false,
});

async function restoreAndCleanup() {
  const client = await pool.connect();
  
  try {
    console.log('=== データベース復元・クリーンアップ開始 ===\n');
    
    // 1. 不要なスキーマを削除
    console.log('1. 不要なスキーマを削除中...');
    try {
      await client.query('DROP SCHEMA IF EXISTS drizzle CASCADE;');
      console.log('  ✅ drizzleスキーマを削除しました');
    } catch (error) {
      console.log('  ⚠️ drizzleスキーマの削除をスキップ:', error.message);
    }
    
    try {
      await client.query('DROP SCHEMA IF EXISTS history_record CASCADE;');
      console.log('  ✅ history_recordスキーマを削除しました');
    } catch (error) {
      console.log('  ⚠️ history_recordスキーマの削除をスキップ:', error.message);
    }
    
    // 2. master_dataスキーマの存在確認
    console.log('\n2. master_dataスキーマの確認中...');
    const schemaCheck = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = 'master_data';
    `);
    
    if (schemaCheck.rows.length > 0) {
      console.log('  ℹ️ master_dataスキーマは既に存在します');
      
      // テーブル数を確認
      const tableCheck = await client.query(`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'master_data';
      `);
      
      console.log(`  ℹ️ master_dataに ${tableCheck.rows[0].count} テーブルが存在します`);
      
      if (tableCheck.rows[0].count === '0') {
        console.log('  ⚠️ テーブルが0なので、スキーマを削除して再作成します');
        await client.query('DROP SCHEMA IF EXISTS master_data CASCADE;');
      } else {
        console.log('  ✅ master_dataスキーマは正常です。復元をスキップします。\n');
        await displayCurrentState(client);
        return;
      }
    }
    
    // 3. master_dataスキーマを復元
    console.log('\n3. master_dataスキーマを復元中...');
    
    await client.query('CREATE SCHEMA IF NOT EXISTS master_data;');
    console.log('  ✅ master_dataスキーマを作成しました');
    
    // management_officesテーブル
    await client.query(`
      CREATE TABLE master_data.management_offices (
        id SERIAL PRIMARY KEY,
        office_name VARCHAR(100) NOT NULL,
        office_code VARCHAR(20) UNIQUE NOT NULL,
        responsible_area TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('  ✅ management_officesテーブルを作成しました');
    
    // basesテーブル
    await client.query(`
      CREATE TABLE master_data.bases (
        id SERIAL PRIMARY KEY,
        base_name VARCHAR(100) NOT NULL,
        base_type VARCHAR(50) NOT NULL DEFAULT 'maintenance',
        location VARCHAR(200),
        management_office_id INTEGER REFERENCES master_data.management_offices(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('  ✅ basesテーブルを作成しました');
    
    // vehicle_typesテーブル
    await client.query(`
      CREATE TABLE master_data.vehicle_types (
        id SERIAL PRIMARY KEY,
        type_name VARCHAR(50) NOT NULL UNIQUE,
        category VARCHAR(50),
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('  ✅ vehicle_typesテーブルを作成しました');
    
    // vehiclesテーブル
    await client.query(`
      CREATE TABLE master_data.vehicles (
        id SERIAL PRIMARY KEY,
        machine_number VARCHAR(20) UNIQUE NOT NULL,
        vehicle_type VARCHAR(50) NOT NULL,
        model VARCHAR(50),
        manufacturer VARCHAR(100),
        acquisition_date DATE,
        management_office_id INTEGER REFERENCES master_data.management_offices(id),
        home_base_id INTEGER REFERENCES master_data.bases(id),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('  ✅ vehiclesテーブルを作成しました');
    
    // inspection_typesテーブル
    await client.query(`
      CREATE TABLE master_data.inspection_types (
        id SERIAL PRIMARY KEY,
        type_name VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        interval_days INTEGER,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('  ✅ inspection_typesテーブルを作成しました');
    
    // インデックス作成
    await client.query('CREATE INDEX idx_vehicles_type ON master_data.vehicles(vehicle_type);');
    await client.query('CREATE INDEX idx_vehicles_office ON master_data.vehicles(management_office_id);');
    await client.query('CREATE INDEX idx_vehicles_base ON master_data.vehicles(home_base_id);');
    await client.query('CREATE INDEX idx_vehicles_status ON master_data.vehicles(status);');
    console.log('  ✅ インデックスを作成しました');
    
    // トリガー作成
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await client.query('DROP TRIGGER IF EXISTS update_management_offices_updated_at ON master_data.management_offices;');
    await client.query('CREATE TRIGGER update_management_offices_updated_at BEFORE UPDATE ON master_data.management_offices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();');
    
    await client.query('DROP TRIGGER IF EXISTS update_bases_updated_at ON master_data.bases;');
    await client.query('CREATE TRIGGER update_bases_updated_at BEFORE UPDATE ON master_data.bases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();');
    
    await client.query('DROP TRIGGER IF EXISTS update_vehicles_updated_at ON master_data.vehicles;');
    await client.query('CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON master_data.vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();');
    console.log('  ✅ トリガーを作成しました');
    
    console.log('\n=== 復元・クリーンアップ完了 ===\n');
    
    // 最終状態を表示
    await displayCurrentState(client);
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function displayCurrentState(client) {
  console.log('=== 現在のデータベース状態 ===\n');
  
  const schemas = await client.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name IN ('master_data', 'operations', 'inspections', 'maintenance')
    ORDER BY schema_name;
  `);
  
  console.log('システムで使用するスキーマ:');
  for (const row of schemas.rows) {
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1
      ORDER BY table_name;
    `, [row.schema_name]);
    
    console.log(`\n${row.schema_name}: (${tables.rows.length}テーブル)`);
    tables.rows.forEach(t => {
      console.log(`  - ${t.table_name}`);
    });
  }
}

restoreAndCleanup().catch(console.error);
