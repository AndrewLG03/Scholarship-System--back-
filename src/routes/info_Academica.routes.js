const express = require('express');
const router = express.Router();

const {
    createInfoAcademica,
    getAllInfoAcademica,
    getInfoAcademicaByUsuario,
    updateInfoAcademica
} = require('../controllers/info_Academica.controller');

// Guardar información académica
router.post('/', createInfoAcademica);

// Obtener todos los registros
router.get('/', getAllInfoAcademica);

// Obtener información académica por usuario
router.get('/usuario/:id_usuario', getInfoAcademicaByUsuario);

// Actualizar información académica
router.put('/:id_info_academica', updateInfoAcademica);

module.exports = router;
