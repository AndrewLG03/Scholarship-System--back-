// src/config/database.js
require('dotenv').config();
const mysql = require('mysql2/promise');

// Pool de conexiones a MySQL / MariaDB
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost', // localhost
  user: process.env.DB_USER,               // ProyectoDB
  password: process.env.DB_PASSWORD,       // tu contraseña
  database: process.env.DB_NAME,           // BecasDB
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
// Ejecutar Stored Procedures con parámetros nombrados
async function executeSP(spName, params = {}) {
  const conn = await pool.getConnection();
  try {
    const keys = Object.keys(params);

    const placeholders = keys.map(() => '?').join(',');
    const sql = keys.length > 0
      ? `CALL ${spName}(${placeholders})`
      : `CALL ${spName}()`;

    const values = Object.values(params);

    const [rows] = await conn.query(sql, values);
    return rows;
  } finally {
    conn.release();
  }
}

module.exports = {
  pool,
  testConnection,
  executeSP,
};
