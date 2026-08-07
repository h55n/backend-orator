import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: 'REDACTED_SECRET',
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        question_id VARCHAR(255) NOT NULL,
        question_data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, question_id)
      );
    `);
    console.log("Favorites table created successfully");
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
run();
