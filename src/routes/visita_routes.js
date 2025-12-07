const express = require('express');
const router = express.Router();

const visitasController = require('../controllers/visita_domiciliaria.controller');

// Listar todas
router.get('/', visitasController.listVisitas);

// Obtener una
router.get('/:id', visitasController.getVisita);

// Crear
router.post('/', visitasController.createVisita);

// Actualizar
router.put('/:id', visitasController.updateVisita);

// Eliminar
router.delete('/:id', visitasController.deleteVisita);

module.exports = router;
