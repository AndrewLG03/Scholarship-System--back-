// src/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
// AGREGAR MAS RUTAS: ASPIRANTES, BECADO ETC..
router.use('/auth', authRoutes);

// health endpoint
router.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = router;
