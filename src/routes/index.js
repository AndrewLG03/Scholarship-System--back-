// src/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const comiteRoutes = require('./comite.routes');

// más rutas: aspirantes, becados, admin... se agregan aquí

router.use('/auth', authRoutes);
router.use('/comite', comiteRoutes);


// health
router.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = router;
