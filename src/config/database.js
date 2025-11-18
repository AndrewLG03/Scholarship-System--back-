const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: "tiusr36pl.cuc-carrera-ti.ac.cr",
    user: "ProyectoDB", 
    password: "Proyecto_SQL",
    database: "BecasDB",
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Probar conexión
pool.getConnection()
  .then(connection => {
    console.log('✅ Conectado a la base de datos MySQL - BecasDB');
    connection.release();
  })
  .catch(error => {
    console.error('❌ Error conectando a la base de datos:', error.message);
  });

// Exporta directamente el pool
module.exports = pool;