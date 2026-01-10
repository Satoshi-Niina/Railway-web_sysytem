import pkg from 'pg'
const { Pool } = pkg
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// .env.developmentを読み込む
dotenv.config({ path: join(__dirname, '..', '.env.development') })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

async function fixMachineTypeIds() {
  const client = await pool.connect()
  try {
    console.log('Starting to fix machine_type_id in machines table...')
    
    // まず、現在のmachine_typesテーブルのデータを取得
    const typesResult = await client.query(`
      SELECT id, type_name, model_name 
      FROM master_data.machine_types 
      ORDER BY type_name
    `)
    
    console.log('\nAvailable machine types:')
    typesResult.rows.forEach(t => {
      console.log(`  ${t.id}: ${t.type_name} (${t.model_name})`)
    })
    
    // 現在のmachinesテーブルのデータを確認
    const machinesResult = await client.query(`
      SELECT m.id, m.machine_number, m.machine_type_id, m.office_id
      FROM master_data.machines m
      ORDER BY m.machine_number
    `)
    
    console.log('\nCurrent machines data:')
    machinesResult.rows.forEach(m => {
      console.log(`  ${m.machine_number}: type_id=${m.machine_type_id}, office_id=${m.office_id}`)
    })
    
    // MC300タイプのIDを1つ選択（例：MT0001）
    const mc300TypeId = 'MT0001'
    
    // 機械番号に基づいて適切な機種IDを設定
    const updates = [
      // MC300系 - 300, 500
      { machine_number: '300', type_id: mc300TypeId },
      { machine_number: '500', type_id: 'MT-07663885' }, // 既に正しいID
      
      // TD100系
      { machine_number: 'TD100-001', type_id: mc300TypeId }, // 仮にMC300にマッピング
      { machine_number: 'TD100-002', type_id: mc300TypeId },
      
      // TD200系
      { machine_number: 'TD200-001', type_id: mc300TypeId },
      { machine_number: 'TD200-002', type_id: mc300TypeId },
      
      // TROLLEY系
      { machine_number: 'TROLLEY10-001', type_id: mc300TypeId },
      { machine_number: 'TROLLEY25-001', type_id: mc300TypeId },
      
      // コンテナ系
      { machine_number: 'BOX-001', type_id: mc300TypeId },
      { machine_number: 'HOPPER-001', type_id: mc300TypeId },
    ]
    
    console.log('\nUpdating machine_type_id values...')
    for (const update of updates) {
      const result = await client.query(
        `UPDATE master_data.machines 
         SET machine_type_id = $1 
         WHERE machine_number = $2`,
        [update.type_id, update.machine_number]
      )
      console.log(`  Updated ${update.machine_number}: type_id -> ${update.type_id}`)
    }
    
    // 更新後のデータを確認
    const verifyResult = await client.query(`
      SELECT m.id, m.machine_number, m.machine_type_id, m.office_id, mt.type_name
      FROM master_data.machines m
      LEFT JOIN master_data.machine_types mt ON m.machine_type_id::text = mt.id::text
      ORDER BY m.machine_number
    `)
    
    console.log('\nVerification - Updated machines:')
    verifyResult.rows.forEach(m => {
      console.log(`  ${m.machine_number}: type=${m.type_name} (${m.machine_type_id}), office=${m.office_id}`)
    })
    
    console.log('\n✅ Machine type IDs fixed successfully!')
    
  } catch (error) {
    console.error('Error fixing machine type IDs:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

fixMachineTypeIds().catch(console.error)
