const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const { onlyCommittee } = require("../middleware/roleMiddleware");

const {
  getSolicitudesPendientes,
  getExpediente,
  aprobarSolicitud,
  denegarSolicitud,
  generarInforme
} = require("../controllers/comiteController.js");

// Rutas protegidas SOLO para comité
router.get("/pendientes", verifyToken, onlyCommittee, getSolicitudesPendientes);
router.get("/expediente/:id", verifyToken, onlyCommittee, getExpediente);
router.put("/aprobar/:id", verifyToken, onlyCommittee, aprobarSolicitud);
router.put("/denegar/:id", verifyToken, onlyCommittee, denegarSolicitud);
router.get("/informe", verifyToken, onlyCommittee, generarInforme);

module.exports = router;
