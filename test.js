import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required to run the database diagnostic.');
  process.exitCode = 1;
} else {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    console.log(result.rows);
  } catch {
    console.error('Database diagnostic failed. Verify DATABASE_URL and database availability.');
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
