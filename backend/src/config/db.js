const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecommerce',
  waitForConnections: true,
  connectionLimit: process.env.DB_CONNECTION_LIMIT ? Number(process.env.DB_CONNECTION_LIMIT) : 10,
  queueLimit: 0,
  namedPlaceholders: true,
  decimalNumbers: true,
});

async function initializeDatabase() {
  const connection = await pool.getConnection();

  try {
    await connection.ping();
    console.log('Connected to MySQL database');
  } finally {
    connection.release();
  }
}

async function query(sql, values = []) {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.execute(sql, values);
    return results;
  } finally {
    connection.release();
  }
}

async function queryOne(sql, values = []) {
  const results = await query(sql, values);
  return results.length ? results[0] : null;
}

module.exports = {
  pool,
  initializeDatabase,
  query,
  queryOne,
};
