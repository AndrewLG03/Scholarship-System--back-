<<<<<<< HEAD
// src/config/index.js
=======
// backend/src/config/index.js
>>>>>>> 55fd35a4906540faf3aab4b4a3a4b9a73372fd77
const transporter = require('./email');
const { pool } = require('./database');

module.exports = {
    transporter,
    pool
};
