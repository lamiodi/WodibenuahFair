console.log('Starting script...');
import pkg from 'pg';
const { Pool } = pkg;

const connectionString = 'postgresql://postgres.watczlogntkpxvkehjpa:Wodibenuah%402024@aws-0-eu-central-1.pooler.supabase.com:5432/postgres'; 
// Note: I changed host to try the direct connection format often seen.
// But let's stick to the one I constructed before: 
// postgresql://postgres:Wodibenuah%402024@db.watczlogntkpxvkehjpa.supabase.co:5432/postgres

const realConnectionString = 'postgresql://postgres:Wodibenuah%402024@db.watczlogntkpxvkehjpa.supabase.co:5432/postgres';

console.log('Testing connection to:', realConnectionString);

const pool = new Pool({
  connectionString: realConnectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000 // timeout after 5s
});

pool.connect()
  .then(client => {
    console.log('Connected!');
    return client.query('SELECT NOW()')
      .then(res => {
        console.log('Time:', res.rows[0].now);
        client.release();
        pool.end();
      });
  })
  .catch(err => {
    console.error('Error connecting:', err);
    process.exit(1);
  });
