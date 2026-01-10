const { Pool } = require('pg')

async function checkTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    console.log('Checking operations.operation_plans table structure...\n')

    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'operations'
        AND table_name = 'operation_plans'
      ORDER BY ordinal_position
    `)

    if (result.rows.length === 0) {
      console.log('Table operations.operation_plans does not exist.')
    } else {
      console.table(result.rows)
    }

    await pool.end()
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

checkTable()
