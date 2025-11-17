import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware.js";

const { onlyCommittee } = require("../middleware/roleMiddleware");
import {
  getSolicitudesPendientes,
  getExpediente,
  aprobarSolicitud,
  denegarSolicitud,
  generarInforme
} from "../controllers/comiteController.js";

const router = Router();



// Rutas protegidas SOLO para comité
router.get("/pendientes", verifyToken, onlyCommittee, getSolicitudesPendientes);
router.get("/expediente/:id", verifyToken, onlyCommittee, getExpediente);
router.put("/aprobar/:id", verifyToken, onlyCommittee, aprobarSolicitud);
router.put("/denegar/:id", verifyToken, onlyCommittee, denegarSolicitud);
router.get("/informe", verifyToken, onlyCommittee, generarInforme);


export default router;
