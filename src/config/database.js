
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: "tiusr36pl.cuc-carrera-ti.ac.cr",
    user: "ProyectoDB",
    password: "Proyecto_SQL",
    database: "BecasDB",
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10
    queueLimit: 0
});

// Test de conexión
(async () => {
    try {
        await pool.query("SELECT 1");
        console.log("MySQL pool OK.");
    } catch (error) {
        console.error("Error conectando a MySQL:", error);
    }
})();


module.exports = { pool };
