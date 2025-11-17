import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  getSolicitudesPendientes,
  getExpediente,
  aprobarSolicitud,
  denegarSolicitud,
  generarInforme
} from "../controllers/comiteController.js";

const router = Router();

// Rutas protegidas SOLO para comité
router.get("/pendientes", verifyToken, getSolicitudesPendientes);
router.get("/expediente/:id", verifyToken, getExpediente);
router.put("/aprobar/:id", verifyToken, aprobarSolicitud);
router.put("/denegar/:id", verifyToken, denegarSolicitud);
router.get("/informe", verifyToken, generarInforme);

export default router;
