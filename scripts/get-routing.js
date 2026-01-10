import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({ connectionString: 'postgresql://postgres:Takabeni@localhost:5432/webappdb' });

async function getRouting() {
  try {
    const res = await pool.query('SELECT * FROM public.app_resource_routing');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error(e.message);
  } finally {
    await pool.end();
  }
}

getRouting();
