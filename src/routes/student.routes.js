// src/routes/student.routes.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const studentController = require('../controllers/student.controller');

// Panel de administración del estudiante becado
router.get('/panel', authMiddleware, studentController.getDashboardPanel);
router.get('/expediente', authMiddleware, studentController.getExpediente)
router.get('/perfil', authMiddleware, studentController.getPerfil);

router.put('/perfil', authMiddleware, studentController.updatePerfil);
router.put('/expediente', authMiddleware, studentController.updateExpediente)


module.exports = router;