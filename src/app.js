// src/app.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const routes = require('./routes'); // src/routes/index.js
const errorHandler = require('./utils/errorHandler');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 200
});
app.use(limiter);

// Rutas
app.use('/api', routes);

// Ruta raíz simple
app.get('/', (req, res) => res.json({ ok: true, message: 'API backend' }));

// Manejo global de errores
app.use(errorHandler);

module.exports = app;
