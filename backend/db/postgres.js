// backend/db/postgres.js
// PostgreSQL connection using pg with a connection pool

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Pool } = require('pg');

// Use DATABASE_URL (Neon) or fallback to POSTGRES_URI
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URI;
if (!connectionString) {
  throw new Error('DATABASE_URL or POSTGRES_URI environment variable is required for PostgreSQL connection');
}

const pool = new Pool({
  connectionString,
  // Neon requires SSL
  ssl: {
    rejectUnauthorized: false
  }
});

// Simple query wrapper
async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

// Batch insert helper – rows is array of arrays matching columns order
async function batchInsert(table, columns, rows) {
  if (!rows.length) return;
  const columnList = columns.map(col => `"${col}"`).join(', ');
  const valuePlaceholders = rows
    .map((_, i) => {
      const offset = i * columns.length;
      const placeholders = columns.map((_, j) => `$${offset + j + 1}`).join(', ');
      return `(${placeholders})`;
    })
    .join(', ');
  const flatValues = rows.flat();
  const sql = `INSERT INTO "${table}" (${columnList}) VALUES ${valuePlaceholders} ON CONFLICT DO NOTHING;`;
  await query(sql, flatValues);
}

module.exports = {
  query,
  batchInsert,
  pool // export for graceful shutdown if needed
};
