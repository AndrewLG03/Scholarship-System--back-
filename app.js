// backend/app.js - Express configuration (CommonJS)
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit'); // 👈 CORREGIDO
require('dotenv').config();

const routes = require('./src/routes'); // src/routes/index.js
const errorHandler = require('./src/utils/errorHandler');

const app = express();

app.use(helmet());
app.use(cors()); // en desarrollo permite todo; restringir en producción
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 200,
});
app.use(limiter);

// mount API routes
app.use('/api', routes);

// root health
app.get('/', (req, res) => res.json({ ok: true, message: 'API - backend (Express + MySQL)' }));

// global error handler
app.use(errorHandler);

module.exports = app;
