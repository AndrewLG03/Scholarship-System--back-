// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();

let authController;
    try {
    authController = require('../controllers/auth.controller');
    } catch (err) {
    // si no existe el controlador, proveemos respuestas de placeholder
    authController = {
        register: (req, res) => res.status(501).json({ message: 'Register endpoint not implemented' }),
<<<<<<< HEAD
        login: (req, res) => res.status(501).json({ message: 'Login endpoint not implemented' })
=======
        login: (req, res) => res.status(501).json({ message: 'Login endpoint not implemented' }),
        getMe: (req, res) => res.status(501).json({ message: 'GetMe endpoint not implemented' })
>>>>>>> 55fd35a4906540faf3aab4b4a3a4b9a73372fd77
    };
}

// endpoints mínimos
router.post('/register', authController.register);
router.post('/login', authController.login);
<<<<<<< HEAD
=======
router.get('/me', authController.getMe);
>>>>>>> 55fd35a4906540faf3aab4b4a3a4b9a73372fd77

module.exports = router;