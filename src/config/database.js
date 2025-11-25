<<<<<<< HEAD
// src/config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0
  // Si el servidor requiere SSL, agregar la opción ssl aquí
});

module.exports = { pool };
=======
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
>>>>>>> 55fd35a4906540faf3aab4b4a3a4b9a73372fd77
