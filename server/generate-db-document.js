import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '../.env.development' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// スキーマの説明
const schemaDescriptions = {
  public: { name: '基盤・共通', description: 'システム全体の基盤機能。認証、ルーティング、アクセスログなど' },
  master_data: { name: '共有マスタ', description: '全アプリ共通のマスタデータ。設備、ユーザー、車両など' },
  operations: { name: '運用管理', description: '日常の運用計画と実績管理' },
  inspections: { name: '保守用車管理', description: '保守用車両の点検記録管理' },
  emergency: { name: '応急復旧支援', description: '緊急時の復旧対応、通信、画像管理' },
  maintenance: { name: '機械故障管理', description: '設備の故障記録と履歴管理' }
};

// テーブルの日本語説明
const tableDescriptions = {
  // public
  access_token_policy: { name: 'アクセストークンポリシー', purpose: '認証トークンの権限制御' },
  app_resource_routing: { name: 'リソースルーティング', purpose: 'アプリケーションからテーブルへのルーティング設定' },
  gateway_access_logs: { name: 'アクセスログ', purpose: 'ゲートウェイ経由のアクセス履歴' },
  schema_migrations: { name: 'マイグレーション履歴', purpose: 'データベース変更履歴' },
  
  // master_data
  machines: { name: '機械設備', purpose: '線路機械の基本情報' },
  machine_types: { name: '機械種別', purpose: '機械の種類マスタ' },
  users: { name: 'ユーザー', purpose: 'システム利用者情報' },
  vehicles: { name: '車両', purpose: '保守用車両の基本情報' },
  vehicle_types: { name: '車両種別', purpose: '車両の種類マスタ' },
  inspection_types: { name: '点検種別', purpose: '点検の種類マスタ' },
  keywords: { name: 'キーワード', purpose: '検索用キーワードマスタ' },
  bases: { name: '基地', purpose: '作業基地・拠点情報' },
  base_documents: { name: '基地ドキュメント', purpose: '基地関連の文書' },
  managements_offices: { name: '管理事務所', purpose: '管理事務所マスタ' },
  chat_history: { name: 'チャット履歴', purpose: 'AIチャット履歴' },
  chats: { name: 'チャット', purpose: 'チャットデータ' },
  app_config: { name: 'アプリ設定', purpose: 'アプリケーション設定' },
  app_config_history: { name: 'アプリ設定履歴', purpose: 'アプリ設定の変更履歴' },
  fault_history_images: { name: '故障履歴画像', purpose: '故障記録に紐づく画像' },
  
  // operations
  operation_plans: { name: '運用計画', purpose: '作業運用の計画' },
  operation_records: { name: '運用実績', purpose: '作業運用の実績記録' },
  schedules: { name: 'スケジュール', purpose: '運用スケジュール' },
  support_flows: { name: 'サポートフロー', purpose: 'サポート業務のフロー定義' },
  support_history: { name: 'サポート履歴', purpose: 'サポート対応履歴' },
  
  // inspections
  inspection_records: { name: '点検記録', purpose: '車両点検の実施記録' },
  
  // emergency
  emergency_records: { name: '緊急対応記録', purpose: '緊急復旧作業の記録' },
  emergency_flows: { name: '緊急対応フロー', purpose: '緊急時の対応手順' },
  messages: { name: 'メッセージ', purpose: '緊急時のメッセージ通信' },
  media: { name: 'メディア', purpose: '画像・動画などのメディアファイル' },
  images: { name: '画像', purpose: '緊急対応時の画像' },
  image_data: { name: '画像データ', purpose: '画像のバイナリデータ' },
  chat_exports: { name: 'チャットエクスポート', purpose: 'チャット履歴のエクスポート' },
  chat_history_backup: { name: 'チャット履歴バックアップ', purpose: 'チャット履歴のバックアップ' },
  
  // maintenance
  fault_records: { name: '故障記録', purpose: '設備故障の発生記録' },
  fault_history: { name: '故障履歴', purpose: '故障の詳細履歴' }
};

async function generateDatabaseDocument() {
  const schemas = ['public', 'master_data', 'operations', 'inspections', 'emergency', 'maintenance'];
  
  let markdown = `# Railway Maintenance System - データベース構造

**生成日時**: ${new Date().toLocaleString('ja-JP')}  
**データベース**: webappdb

---

## 目次

1. [スキーマ構成概要](#スキーマ構成概要)
2. [スキーマツリー](#スキーマツリー)
3. [テーブル一覧](#テーブル一覧)
4. [詳細定義](#詳細定義)

---

## スキーマ構成概要

本システムは6つのスキーマで構成され、業務領域ごとにデータを分離管理しています。

| スキーマ | 日本語名 | 役割 | テーブル数 |
|---------|---------|------|-----------|
`;

  // 各スキーマのテーブル数を取得
  for (const schema of schemas) {
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = $1 AND table_type = 'BASE TABLE'
    `, [schema]);
    
    const count = result.rows[0].count;
    const desc = schemaDescriptions[schema];
    markdown += `| \`${schema}\` | ${desc.name} | ${desc.description} | ${count} |\n`;
  }
  
  markdown += `\n---\n\n## スキーマツリー\n\n\`\`\`\nwebappdb/\n`;
  
  // ツリー構造を生成
  for (const schema of schemas) {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = $1 AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `, [schema]);
    
    const desc = schemaDescriptions[schema];
    markdown += `├── ${schema}/ (${desc.name})\n`;
    
    result.rows.forEach((row, index) => {
      const isLast = index === result.rows.length - 1;
      const prefix = isLast ? '└──' : '├──';
      const tableDesc = tableDescriptions[row.table_name];
      const tableName = tableDesc ? `${row.table_name} (${tableDesc.name})` : row.table_name;
      markdown += `│   ${prefix} ${tableName}\n`;
    });
    markdown += `│\n`;
  }
  
  markdown += `\`\`\`\n\n---\n\n## テーブル一覧\n\n`;
  
  // スキーマごとのテーブル一覧
  for (const schema of schemas) {
    const desc = schemaDescriptions[schema];
    markdown += `### ${desc.name} (\`${schema}\`)\n\n`;
    markdown += `${desc.description}\n\n`;
    markdown += `| # | テーブル名 | 日本語名 | 用途 | レコード数 |\n`;
    markdown += `|---|-----------|---------|------|----------|\n`;
    
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = $1 AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `, [schema]);
    
    let index = 1;
    for (const row of result.rows) {
      const tableDesc = tableDescriptions[row.table_name] || { name: '未定義', purpose: '-' };
      
      // レコード数を取得
      let rowCount = '-';
      try {
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM "${schema}"."${row.table_name}"`);
        rowCount = countResult.rows[0].count;
      } catch (error) {
        rowCount = 'エラー';
      }
      
      markdown += `| ${index} | \`${row.table_name}\` | ${tableDesc.name} | ${tableDesc.purpose} | ${rowCount} |\n`;
      index++;
    }
    
    markdown += `\n`;
  }
  
  markdown += `---\n\n## 詳細定義\n\n`;
  
  // 各テーブルの詳細
  for (const schema of schemas) {
    const desc = schemaDescriptions[schema];
    markdown += `### ${desc.name} (\`${schema}\`)\n\n`;
    
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = $1 AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `, [schema]);
    
    for (const table of tables.rows) {
      const tableName = table.table_name;
      const tableDesc = tableDescriptions[tableName] || { name: '未定義', purpose: '-' };
      
      markdown += `#### ${tableDesc.name} (\`${tableName}\`)\n\n`;
      markdown += `**用途**: ${tableDesc.purpose}\n\n`;
      
      // カラム情報を取得
      const columns = await pool.query(`
        SELECT 
          c.column_name,
          c.data_type,
          c.character_maximum_length,
          c.is_nullable,
          c.column_default,
          pgd.description
        FROM information_schema.columns c
        LEFT JOIN pg_catalog.pg_statio_all_tables st ON c.table_schema = st.schemaname AND c.table_name = st.relname
        LEFT JOIN pg_catalog.pg_description pgd ON st.relid = pgd.objoid AND c.ordinal_position = pgd.objsubid
        WHERE c.table_schema = $1 AND c.table_name = $2
        ORDER BY c.ordinal_position
      `, [schema, tableName]);
      
      markdown += `| カラム名 | データ型 | NULL | デフォルト | 説明 |\n`;
      markdown += `|---------|---------|------|-----------|------|\n`;
      
      columns.rows.forEach(col => {
        let dataType = col.data_type;
        if (col.character_maximum_length) {
          dataType += `(${col.character_maximum_length})`;
        }
        const nullable = col.is_nullable === 'YES' ? '✓' : '-';
        const defaultVal = col.column_default || '-';
        const description = col.description || getColumnDescription(tableName, col.column_name);
        
        markdown += `| \`${col.column_name}\` | ${dataType} | ${nullable} | ${defaultVal} | ${description} |\n`;
      });
      
      markdown += `\n`;
    }
  }
  
  markdown += `---\n\n## 補足情報\n\n`;
  markdown += `### 命名規則\n\n`;
  markdown += `- **スキーマ**: 業務領域を表すスネークケース\n`;
  markdown += `- **テーブル**: 複数形のスネークケース\n`;
  markdown += `- **カラム**: スネークケース\n`;
  markdown += `- **主キー**: \`{テーブル名単数}_id\` または \`id\`\n\n`;
  
  markdown += `### スキーマ間の関連\n\n`;
  markdown += `- 全スキーマは \`master_data\` の共有マスタを参照可能\n`;
  markdown += `- 業務スキーマ間での直接参照は原則禁止\n`;
  markdown += `- アプリケーションレイヤーで結合処理を実施\n\n`;
  
  markdown += `### アクセス制御\n\n`;
  markdown += `- \`public.app_resource_routing\` でアプリケーション別のテーブルアクセスを制御\n`;
  markdown += `- \`public.access_token_policy\` で認証トークンベースの権限管理\n\n`;
  
  markdown += `---\n\n`;
  markdown += `*このドキュメントは自動生成されました*\n`;
  
  return markdown;
}

function getColumnDescription(tableName, columnName) {
  // 一般的なカラム名の説明
  const commonDescriptions = {
    'id': '主キー',
    'created_at': '作成日時',
    'updated_at': '更新日時',
    'user_id': 'ユーザーID',
    'title': 'タイトル',
    'content': '内容',
    'description': '説明',
    'name': '名前',
    'type': '種別',
    'status': 'ステータス',
    'is_active': '有効フラグ',
    'is_readonly': '読み取り専用フラグ',
  };
  
  // テーブル固有の説明
  const specificDescriptions = {
    access_token_policy: {
      policy_id: 'ポリシーID',
      token_role_claim: 'トークンロール',
      allowed_logical_name: '許可リソース名',
      can_write: '書き込み権限'
    },
    app_resource_routing: {
      routing_id: 'ルーティングID',
      app_id: 'アプリケーションID',
      logical_resource_name: '論理リソース名',
      physical_schema: '物理スキーマ名',
      physical_table: '物理テーブル名'
    },
    machines: {
      machine_id: '機械ID',
      machine_number: '機械番号',
      machine_type_id: '機械種別ID'
    },
    vehicles: {
      vehicle_id: '車両ID',
      vehicle_number: '車両番号',
      vehicle_type_id: '車両種別ID'
    }
  };
  
  if (specificDescriptions[tableName] && specificDescriptions[tableName][columnName]) {
    return specificDescriptions[tableName][columnName];
  }
  
  return commonDescriptions[columnName] || '-';
}

async function main() {
  try {
    console.log('データベース構造ドキュメントを生成中...\n');
    
    const markdown = await generateDatabaseDocument();
    
    // ファイルに保存
    const outputPath = '../DATABASE_STRUCTURE.md';
    fs.writeFileSync(outputPath, markdown, 'utf8');
    
    console.log('✅ ドキュメント生成完了');
    console.log(`📄 出力先: ${outputPath}`);
    console.log(`📊 文字数: ${markdown.length.toLocaleString()}`);
  } catch (error) {
    console.error('❌ エラー:', error);
    throw error;
  }
}

main()
  .then(() => pool.end())
  .catch(error => {
    console.error('処理失敗:', error);
    pool.end();
    process.exit(1);
  });
