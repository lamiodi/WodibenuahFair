import pool from './db.js';
import dotenv from 'dotenv';
dotenv.config();

const updateLocation = async () => {
  try {
    const result = await pool.query(`
      UPDATE events
      SET location = 'Abuja (Venue TBD)'
      WHERE location LIKE '%International Conference%'
      RETURNING *;
    `);
    
    console.log(`Updated ${result.rowCount} events.`);
    console.table(result.rows);
    process.exit(0);
  } catch (error) {
    console.error('Error updating events:', error);
    process.exit(1);
  }
};

updateLocation();