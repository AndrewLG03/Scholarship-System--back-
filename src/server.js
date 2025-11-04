// src/server.js
require('dotenv').config();
const app = require('./app');
const { getPool } = require('./config/database');

const PORT = process.env.PORT || 3000;

(async () => {
    try {
        // Intentar conexión a DB
        await getPool();
        app.listen(PORT, () => {
        console.log(`Server escuchando en puerto ${PORT}`);
        });
    } catch (err) {
        console.error('No se pudo iniciar la app. Error:', err);
        process.exit(1);
    }
})();
