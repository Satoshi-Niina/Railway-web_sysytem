import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:Takabeni@localhost:5432/webappdb'
});

async function testInspectionQuery() {
  try {
    console.log('=== Testing Inspection Schedule Query ===\n');
    
    // Test 1: Check if inspection_cycle_order table has data
    console.log('1. Checking inspection_cycle_order table...');
    const cycleOrderQuery = `
      SELECT COUNT(*) as count FROM inspections.inspection_cycle_order
    `;
    const cycleOrderResult = await pool.query(cycleOrderQuery);
    console.log(`   Found ${cycleOrderResult.rows[0].count} rows in inspection_cycle_order\n`);
    
    // Test 2: Check if vehicle_inspection_records table has data
    console.log('2. Checking vehicle_inspection_records table...');
    const recordsQuery = `
      SELECT COUNT(*) as count FROM inspections.vehicle_inspection_records
    `;
    const recordsResult = await pool.query(recordsQuery);
    console.log(`   Found ${recordsResult.rows[0].count} rows in vehicle_inspection_records\n`);
    
    // Test 3: Check active vehicles
    console.log('3. Checking active vehicles...');
    const vehiclesQuery = `
      SELECT COUNT(*) as count, 
             string_agg(DISTINCT vehicle_type, ', ') as vehicle_types
      FROM master_data.vehicles 
      WHERE status = 'active'
    `;
    const vehiclesResult = await pool.query(vehiclesQuery);
    console.log(`   Found ${vehiclesResult.rows[0].count} active vehicles`);
    console.log(`   Vehicle types: ${vehiclesResult.rows[0].vehicle_types}\n`);
    
    // Test 4: If vehicle_inspection_records is empty, simulate the API behavior
    if (recordsResult.rows[0].count === '0' || recordsResult.rows[0].count === 0) {
      console.log('4. vehicle_inspection_records is empty - API should return empty array');
      console.log('   This is the expected behavior for the current implementation.\n');
    } else {
      console.log('4. Testing the actual inspection schedule query...');
      const month = '2026-02';
      const [year, monthNum] = month.split('-');
      const startDate = `${year}-${monthNum}-01`;
      const endDate = `${year}-${String(Number(monthNum) + 1).padStart(2, '0')}-01`;
      
      const scheduleQuery = `
        WITH latest_inspections AS (
          SELECT DISTINCT ON (vehicle_id)
            vehicle_id,
            inspection_type,
            inspection_date,
            cycle_order,
            next_inspection_date
          FROM inspections.vehicle_inspection_records
          ORDER BY vehicle_id, inspection_date DESC
        ),
        next_cycle AS (
          SELECT 
            li.vehicle_id,
            v.machine_number,
            v.vehicle_type,
            li.inspection_type as last_inspection_type,
            li.inspection_date as last_inspection_date,
            li.cycle_order as last_cycle_order,
            ico.inspection_type as next_inspection_type,
            ico.cycle_order as next_cycle_order,
            ico.cycle_months,
            ico.warning_months,
            li.inspection_date + (INTERVAL '1 month' * ico.cycle_months) as next_inspection_date,
            li.inspection_date + (INTERVAL '1 month' * (ico.cycle_months - ico.warning_months)) as warning_start_date
          FROM latest_inspections li
          JOIN master_data.vehicles v ON li.vehicle_id = v.id
          LEFT JOIN inspections.inspection_cycle_order ico ON 
            ico.vehicle_type = v.vehicle_type AND 
            ico.cycle_order = (
              SELECT MIN(cycle_order) 
              FROM inspections.inspection_cycle_order 
              WHERE vehicle_type = v.vehicle_type 
              AND cycle_order > li.cycle_order
              AND is_active = true
            )
          WHERE v.status = 'active'
        )
        SELECT 
          nc.*,
          CASE 
            WHEN CURRENT_DATE >= warning_start_date::date THEN true
            ELSE false
          END as is_warning,
          CASE
            WHEN next_inspection_date::date BETWEEN $1::date AND $2::date THEN true
            ELSE false
          END as is_in_period,
          (next_inspection_date::date - CURRENT_DATE) as days_until_inspection
        FROM next_cycle nc
        ORDER BY nc.vehicle_id, next_inspection_date
        LIMIT 5
      `;
      
      const scheduleResult = await pool.query(scheduleQuery, [startDate, endDate]);
      console.log(`   Found ${scheduleResult.rows.length} inspection schedules`);
      if (scheduleResult.rows.length > 0) {
        console.log('   Sample data:');
        console.log(JSON.stringify(scheduleResult.rows[0], null, 2));
      }
      console.log();
    }
    
    console.log('=== Test Complete ===');
    
  } catch (error) {
    console.error('Error during test:', error);
    if (error.message) {
      console.error('Error message:', error.message);
    }
    if (error.code) {
      console.error('Error code:', error.code);
    }
  } finally {
    await pool.end();
  }
}

testInspectionQuery();
