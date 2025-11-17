// src/server.js
require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/database'); // 👈 usamos pool, no getPool

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    // Probar conexión a la base de datos
    const conn = await pool.getConnection();
    await conn.ping();       // opcional, solo para verificar
    conn.release();          // liberamos la conexión

    app.listen(PORT, () => {
      console.log(`Server escuchando en puerto ${PORT}`);
    });
  } catch (err) {
    console.error('No se pudo iniciar la app. Error:', err);
    process.exit(1);
  }
})();
