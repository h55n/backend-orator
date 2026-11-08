import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is required to initialize the database.');
  process.exitCode = 1;
} else {
  const pool = new Pool({ connectionString });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assessments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        job_role VARCHAR(255) NOT NULL,
        technology VARCHAR(255) NOT NULL,
        experience_level VARCHAR(255) NOT NULL,
        assessment_data TEXT NOT NULL,
        score INTEGER,
        cheating_detected BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tables created successfully');
  } catch {
    console.error('Database initialization failed. Verify DATABASE_URL and database availability.');
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
