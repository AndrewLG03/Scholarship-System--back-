// src/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const studentRoutes = require('./student.routes'); //*
// más rutas: aspirantes, becados, admin... se agregan aquí

router.use('/auth', authRoutes);
router.use('/student', studentRoutes); //*

// health
router.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = router;