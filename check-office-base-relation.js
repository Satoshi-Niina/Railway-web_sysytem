import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'webappdb',
  user: 'clouddbadmin',
  password: 'satoshi0812',
});

async function checkRelation() {
  try {
    await client.connect();
    console.log('データベースに接続しました\n');

    // 事業所一覧を取得
    console.log('=== 事業所一覧 ===');
    const officesResult = await client.query(`
      SELECT office_id, office_name, office_code, responsible_area
      FROM master_data.management_offices
      ORDER BY office_code
    `);
    console.table(officesResult.rows);

    // 基地一覧と所属事業所を取得
    console.log('\n=== 基地一覧と所属事業所 ===');
    const basesResult = await client.query(`
      SELECT 
        b.base_id,
        b.base_name,
        b.base_code,
        b.location,
        b.office_id,
        mo.office_name,
        mo.office_code
      FROM master_data.bases b
      LEFT JOIN master_data.management_offices mo ON b.office_id = mo.office_id
      ORDER BY b.base_code
    `);
    console.table(basesResult.rows);

    // 事業所ごとの基地数
    console.log('\n=== 事業所ごとの基地数 ===');
    const countResult = await client.query(`
      SELECT 
        mo.office_id,
        mo.office_name,
        COUNT(b.base_id) as base_count
      FROM master_data.management_offices mo
      LEFT JOIN master_data.bases b ON mo.office_id = b.office_id
      GROUP BY mo.office_id, mo.office_name
      ORDER BY mo.office_name
    `);
    console.table(countResult.rows);

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await client.end();
  }
}

checkRelation();
