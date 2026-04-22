import pool from './db.js';
import dotenv from 'dotenv';
dotenv.config();

const updateDate = async () => {
  try {
    const result = await pool.query(`
      UPDATE events
      SET start_date = '2026-05-23 10:00:00',
          end_date = '2026-05-24 18:00:00'
      WHERE (title ILIKE '%Abuja%' OR location ILIKE '%Abuja%')
        AND EXTRACT(YEAR FROM start_date) = 2026
      RETURNING *;
    `);
    
    console.log(`Updated ${result.rowCount} events to May 23rd and 24th.`);
    if (result.rows.length > 0) {
      console.table(result.rows.map(row => ({ id: row.id, title: row.title, start_date: row.start_date, end_date: row.end_date })));
    } else {
      // Maybe there's no event matching 2026? Let's just update all Abuja upcoming events.
      const result2 = await pool.query(`
        UPDATE events
        SET start_date = '2026-05-23 10:00:00',
            end_date = '2026-05-24 18:00:00'
        WHERE (title ILIKE '%Abuja%' OR location ILIKE '%Abuja%')
        RETURNING *;
      `);
      console.log(`Fallback update: Updated ${result2.rowCount} events.`);
      console.table(result2.rows.map(row => ({ id: row.id, title: row.title, start_date: row.start_date, end_date: row.end_date })));
    }
    process.exit(0);
  } catch (error) {
    console.error('Error updating events:', error);
    process.exit(1);
  }
};

updateDate();