import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'REDACTED_SECRET',
});

async function run() {
  const res = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  console.log(res.rows);
  process.exit();
}
run();
