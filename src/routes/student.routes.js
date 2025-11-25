// src/routes/student.routes.js
const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const authMiddleware = require('../middleware/auth.middleware');
const studentController = require('../controllers/student.controller');

// ====== CONFIGURACIÓN DE MULTER PARA SUBIR ARCHIVOS ======
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        cb(null, `${uniquePrefix}-${sanitized}`);
    },
});
const upload = multer({ storage });


// ====== RUTAS DEL PANEL ESTUDIANTE ======
router.get('/panel', authMiddleware, studentController.getDashboardPanel);
router.get('/expediente', authMiddleware, studentController.getExpediente);
router.get('/perfil', authMiddleware, studentController.getPerfil);

router.put('/perfil', authMiddleware, studentController.updatePerfil);
router.put('/expediente', authMiddleware, studentController.updateExpediente);


// ====== RUTAS AVANZADAS DE SOLICITUDES Y ARCHIVOS ======
router.put('/estudiantes/:studentId', authMiddleware, studentController.updateExpediente);

router.post('/estudiantes/:studentId/solicitudes', authMiddleware, studentController.createSolicitudEstudiante);

router.post('/aspirantes/:aspiranteId/solicitudes', authMiddleware, studentController.createSolicitudAspirante);

router.post('/solicitudes/:solicitudId/documentos', authMiddleware, upload.single('file'), studentController.uploadDocument);

router.get('/resultados/:id', authMiddleware, studentController.getResultados);

router.post('/solicitudes/:solicitudId/apelaciones', authMiddleware, studentController.createAppeal);

router.post('/becas/:becaId/suspensiones', authMiddleware, studentController.createSuspension);


module.exports = router;