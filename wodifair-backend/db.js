import pkg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export const initDb = async () => {
  const client = await pool.connect();
  try {
    console.log('Connected to Database');
    
    // 1. Initialize Schema (Idempotent)
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
        console.log('Database schema checked/initialized');
    }

    // 2. Create Migrations Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Run Migrations
    const migrationsDir = path.join(__dirname, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).sort();
      
      for (const file of files) {
        if (file.endsWith('.sql')) {
          // Check if executed
          const res = await client.query('SELECT 1 FROM migrations WHERE name = $1', [file]);
          if (res.rowCount === 0) {
            console.log(`Running migration: ${file}`);
            const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            
            await client.query('BEGIN');
            try {
              await client.query(migrationSql);
              await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
              await client.query('COMMIT');
              console.log(`Migration ${file} completed`);
            } catch (migErr) {
              await client.query('ROLLBACK');
              console.error(`Migration ${file} failed:`, migErr);
              throw migErr; // Stop subsequent migrations
            }
          }
        }
      }
    }

  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    client.release();
  }
};

export default pool;
