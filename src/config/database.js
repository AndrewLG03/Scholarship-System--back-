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

module.exports = { pool };
