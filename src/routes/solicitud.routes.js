// src/routes/solicitud.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/solicitud.controller');

// Guardar solicitud completa
router.post('/completa', controller.guardarSolicitudCompleta);

module.exports = router;
