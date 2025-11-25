// backend/src/routes/comite.routes.js
const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");

// Controlador del comité
const {
  getSolicitudesPendientes,
  getExpediente,
  aprobarSolicitud,
  denegarSolicitud,
  generarInforme,
  crearSesion,
  getProximaSesion,
  listarSesiones
} = require("../controllers/comite.controller");

// Middleware: SOLO COMITÉ
router.use(verifyToken, requireRole("COMITE"));

// =========================================
// RUTAS PRINCIPALES DEL COMITÉ
// =========================================

// Solicitudes
router.get("/pendientes", getSolicitudesPendientes);
router.get("/expediente/:id", getExpediente);
router.put("/aprobar/:id", aprobarSolicitud);
router.put("/denegar/:id", denegarSolicitud);

// Informe
router.get("/informe", generarInforme);

// Sesiones
router.post("/sesiones", crearSesion);
router.get("/sesiones/proxima", getProximaSesion);
router.get("/sesiones/todas", listarSesiones);

module.exports = router;
