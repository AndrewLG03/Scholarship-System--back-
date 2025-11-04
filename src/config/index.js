// src/config/index.js
const transporter = require('./email');
const { sql, getPool } = require('./database');

module.exports = {
    transporter,
    sql,
    getPool
};
