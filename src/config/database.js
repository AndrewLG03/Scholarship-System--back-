// src/config/database.js
const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT || 1433),
    options: {
        encrypt: false, // true si usas Azure
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === 'true'
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let poolPromise = null;

async function getPool() {
    if (poolPromise) return poolPromise;
    poolPromise = sql.connect(config)
        .then(pool => {
        console.log('MSSQL pool conectado');
        return pool;
        })
        .catch(err => {
        console.error('Error conectando a MSSQL', err);
        poolPromise = null;
        throw err;
        });
    return poolPromise;
}

module.exports = { sql, getPool };