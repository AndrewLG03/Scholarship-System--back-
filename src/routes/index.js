// src/routes/index.js
const express = require('express');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin_routes'); 

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
