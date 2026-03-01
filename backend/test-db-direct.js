import pkg from 'pg';
const { Pool } = pkg;

// Try direct connection instead of pooler
const connectionString = 'postgresql://postgres:Wodibenuah%402024@db.watczlogntkpxvkehjpa.supabase.co:5432/postgres';

console.log('Testing direct connection to:', connectionString.replace(/:[^:/@]+@/, ':***@'));

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to database (Direct)!');
    const res = await client.query('SELECT NOW()');
    console.log('Database time:', res.rows[0].now);
    client.release();
    await pool.end();
  } catch (err) {
    console.error('Direct connection failed:', err);
    process.exit(1);
  }
};

testConnection();
