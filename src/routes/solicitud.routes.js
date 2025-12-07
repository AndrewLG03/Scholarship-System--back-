// src/routes/solicitud.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/solicitud.controller');
const authMiddleware = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

// Configuración de multer para manejo de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Carpeta donde se guardan los archivos
    cb(null, path.join(__dirname, '../../uploads/documentos'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// OBTENER SOLICITUDES DEL USUARIO AUTENTICADO
router.get('/', authMiddleware, controller.obtenerSolicitudesUsuario);

// Guardar solicitud completa
router.post('/completa', controller.guardarSolicitudCompleta);

// Rutas para guardar por pasos
router.post('/paso1', controller.guardarPaso1);
router.post('/paso2', controller.guardarPaso2);
router.post('/paso3', controller.guardarPaso3);
router.post('/paso4', controller.guardarPaso4);
router.post('/paso5', controller.guardarPaso5);
router.post('/paso6', controller.guardarPaso6);
router.post('/paso7', controller.guardarPaso7);

// Documentos de la solicitud
router.post('/:id/docs', upload.single('archivo'), controller.subirDocumento);
router.get('/:id/docs', controller.obtenerDocumentos);


module.exports = router;
