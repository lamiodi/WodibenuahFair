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
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
        console.log('Database schema initialized');
    } else {
        console.warn('schema.sql not found, skipping initialization');
    }
  } catch (err) {
    console.error('Error initializing schema:', err);
  } finally {
    client.release();
  }
};

export default pool;
