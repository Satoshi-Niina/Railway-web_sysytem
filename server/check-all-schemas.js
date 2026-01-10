import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.development' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 期待されるスキーマ構造
const expectedStructure = {
  public: {
    description: '基盤・共通',
    tables: ['access_token_policy', 'app_resource_routing', 'gateway_access_logs', 'schema_migrations']
  },
  master_data: {
    description: '共有マスタ',
    tables: ['machines', 'users', 'inspection_types', 'keywords', 'chat_history', 'base_documents', 'bases']
  },
  operations: {
    description: '運用管理',
    tables: ['operation_plans', 'operation_records', 'schedules', 'support_flows', 'support_history']
  },
  inspections: {
    description: '保守用車管理',
    tables: ['inspection_records']
  },
  emergency: {
    description: '応急復旧支援',
    tables: ['emergency_records', 'emergency_flows', 'messages', 'media', 'images', 'image_data', 'chat_exports', 'chat_history_backup']
  },
  maintenance: {
    description: '機械故障管理',
    tables: ['fault_records', 'fault_history']
  }
};

async function checkDatabaseStructure() {
  try {
    console.log('=== CloudDB スキーマ整合性チェック ===\n');
    
    // 実際のスキーマ一覧を取得
    const schemasQuery = `
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema_name;
    `;
    const schemasResult = await pool.query(schemasQuery);
    const actualSchemas = schemasResult.rows.map(row => row.schema_name);
    
    console.log('【実際のスキーマ一覧】');
    console.log(actualSchemas.join(', '));
    console.log('\n');
    
    // 各スキーマのテーブルを確認
    const results = {};
    
    for (const schema of actualSchemas) {
      const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `;
      const tablesResult = await pool.query(tablesQuery, [schema]);
      const tables = tablesResult.rows.map(row => row.table_name);
      results[schema] = tables;
    }
    
    // 期待構造との比較
    console.log('=== スキーマごとの詳細比較 ===\n');
    
    for (const [schemaName, config] of Object.entries(expectedStructure)) {
      console.log(`【${schemaName}】 - ${config.description}`);
      
      if (!actualSchemas.includes(schemaName)) {
        console.log(`  ❌ スキーマが存在しません`);
        console.log('');
        continue;
      }
      
      console.log(`  ✓ スキーマは存在します`);
      
      const actualTables = results[schemaName] || [];
      const expectedTables = config.tables;
      
      // 期待されるテーブルのチェック
      const missingTables = expectedTables.filter(t => !actualTables.includes(t));
      const extraTables = actualTables.filter(t => !expectedTables.includes(t));
      
      console.log(`  期待テーブル数: ${expectedTables.length}`);
      console.log(`  実際テーブル数: ${actualTables.length}`);
      
      if (missingTables.length > 0) {
        console.log(`  ⚠ 不足しているテーブル: ${missingTables.join(', ')}`);
      } else {
        console.log(`  ✓ 期待されるテーブルはすべて存在`);
      }
      
      if (extraTables.length > 0) {
        console.log(`  ℹ 追加のテーブル: ${extraTables.join(', ')}`);
      }
      
      console.log(`  実際のテーブル: ${actualTables.join(', ')}`);
      console.log('');
    }
    
    // 予期しないスキーマのチェック
    const expectedSchemaNames = Object.keys(expectedStructure);
    const unexpectedSchemas = actualSchemas.filter(s => !expectedSchemaNames.includes(s));
    
    if (unexpectedSchemas.length > 0) {
      console.log('=== 予期しないスキーマ ===\n');
      for (const schema of unexpectedSchemas) {
        console.log(`【${schema}】`);
        console.log(`  テーブル: ${results[schema].join(', ')}`);
        console.log('');
      }
    }
    
    // サマリー
    console.log('=== サマリー ===');
    let allGood = true;
    
    for (const schemaName of expectedSchemaNames) {
      if (!actualSchemas.includes(schemaName)) {
        console.log(`❌ ${schemaName}: スキーマなし`);
        allGood = false;
      } else {
        const actualTables = results[schemaName] || [];
        const expectedTables = expectedStructure[schemaName].tables;
        const missingTables = expectedTables.filter(t => !actualTables.includes(t));
        
        if (missingTables.length > 0) {
          console.log(`⚠ ${schemaName}: ${missingTables.length}個のテーブル不足`);
          allGood = false;
        } else {
          console.log(`✓ ${schemaName}: OK`);
        }
      }
    }
    
    if (allGood) {
      console.log('\n✅ すべてのスキーマとテーブルが期待通りに存在します');
    } else {
      console.log('\n⚠ 一部のスキーマまたはテーブルに問題があります');
    }
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await pool.end();
  }
}

checkDatabaseStructure();
