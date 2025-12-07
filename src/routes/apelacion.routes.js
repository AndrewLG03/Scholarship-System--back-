// src/routes/apelacion.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/apelacion.controller");
const authMiddleware = require("../middleware/auth.middleware");

// OBTENER TODAS LAS APELACIONES DEL USUARIO AUTENTICADO
router.get("/", authMiddleware, controller.obtenerApelaciones);

// OBTENER APELACIONES DE UNA SOLICITUD ESPECÍFICA
router.get("/solicitud/:idSolicitud", authMiddleware, controller.obtenerApelacionesPorSolicitud);

// CREAR UNA NUEVA APELACIÓN
router.post("/", authMiddleware, controller.crearApelacion);

module.exports = router;