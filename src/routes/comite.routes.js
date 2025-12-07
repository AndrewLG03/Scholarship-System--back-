const express = require("express");
const router = express.Router();

// Middleware
const verifyToken = require("../middleware/auth.middleware");

// Controlador del comité
const {
  getSolicitudesPendientes,
  getExpediente,
  aprobarSolicitud,
  denegarSolicitud,
  generarInforme,
  getSolicitudesComite,
  getHistorialComite,
  crearSesion,
  getProximaSesion,
  listarSesiones,
  actualizarSesion,
  eliminarSesion,
  obtenerHistorialDecisiones
  , registrarResolucion
} = require("../controllers/comite.controller");


// ===============================
// SOLICITUDES
// ===============================
router.get("/pendientes", verifyToken, getSolicitudesPendientes);
router.get("/expediente/:id", verifyToken, getExpediente);
router.put("/aprobar/:id", verifyToken, aprobarSolicitud);
router.put("/denegar/:id", verifyToken, denegarSolicitud);
router.get("/informe", verifyToken, generarInforme);

router.get("/solicitudes", verifyToken, getSolicitudesComite);
router.get("/historial", verifyToken, getHistorialComite);


// ===============================
// SESIONES DEL COMITÉ
// ===============================
router.post("/sesiones", verifyToken, crearSesion);
router.get("/sesiones/proxima", verifyToken, getProximaSesion);
router.get("/sesiones/todas", verifyToken, listarSesiones);
router.put("/sesiones/:id", verifyToken, actualizarSesion);
router.delete("/sesiones/:id", verifyToken, eliminarSesion);


// Rutas de decisiones/votación eliminadas
// Historial de decisiones (solo lectura)
router.get("/historial-decisiones", verifyToken, obtenerHistorialDecisiones);
// Registrar una resolución (decisión) para una solicitud
router.post('/resolucion/:id', verifyToken, registrarResolucion);


module.exports = router;
