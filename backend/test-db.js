import pkg from 'pg';
const { Pool } = pkg;

const connectionString = 'postgresql://postgres.watczlogntkpxvkehjpa:Wodibenuah%402024@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

console.log('Testing connection...');

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to database!');
    const res = await client.query('SELECT NOW()');
    console.log('Database time:', res.rows[0].now);
    client.release();
    await pool.end();
  } catch (err) {
    console.error('Connection failed:', err);
    process.exit(1);
  }
};

testConnection();
