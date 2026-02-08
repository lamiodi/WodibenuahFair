import pool from './db.js';

const reset = async () => {
  try {
    console.log('Resetting database...');
    await pool.query('TRUNCATE TABLE vendors, events, blogs RESTART IDENTITY CASCADE');
    console.log('Database reset successfully.');
  } catch (err) {
    console.error('Error resetting database:', err);
  } finally {
    pool.end();
  }
};

reset();