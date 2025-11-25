const express = require("express");
const router = express.Router();

const resultadoController = require("../controllers/resultado.controller");

router.get("/aspirante/:id_aspirante", resultadoController.getResultadosByAspirante);

module.exports = router;
