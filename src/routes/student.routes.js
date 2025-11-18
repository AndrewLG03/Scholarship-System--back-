// backend/src/routes/student.routes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth.middleware');
const studentController = require('../controllers/student.controller');

const router = express.Router();

// Configuración de carpeta y Multer para subir archivos
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9.\\-_]/g, '_');
        cb(null, `${uniquePrefix}-${sanitized}`);
    },
});
const upload = multer({ storage });

/**
 * Endpoints definidos en este router se montan en /api por configuración en index.js
 */

// Actualizar expediente de un estudiante (carnet, carrera, promedio)
router.put('/estudiantes/:studentId', authMiddleware, studentController.updateExpediente);

// Crear solicitud de beca para estudiante
router.post('/estudiantes/:studentId/solicitudes', authMiddleware, studentController.createSolicitudEstudiante);

// Crear solicitud de beca para aspirante
router.post('/aspirantes/:aspiranteId/solicitudes', authMiddleware, studentController.createSolicitudAspirante);

// Cargar documento (un solo archivo) para una solicitud
router.post('/solicitudes/:solicitudId/documentos', authMiddleware, upload.single('file'), studentController.uploadDocument);

// Obtener resoluciones/resultado de las solicitudes de un estudiante o aspirante
router.get('/resultados/:id', authMiddleware, studentController.getResultados);

// Registrar apelación para una solicitud
router.post('/solicitudes/:solicitudId/apelaciones', authMiddleware, studentController.createAppeal);

// Registrar suspensión (justificación) para una beca
router.post('/becas/:becaId/suspensiones', authMiddleware, studentController.createSuspension);

module.exports = router;
