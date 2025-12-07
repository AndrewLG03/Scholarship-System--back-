// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const { decryptData } = require('../utils/encryption');

let authController;
    try {
    authController = require('../controllers/auth.controller');
    } catch (err) {
    // si no existe el controlador, proveemos respuestas de placeholder
    authController = {
        register: (req, res) => res.status(501).json({ message: 'Register endpoint not implemented' }),
        login: (req, res) => res.status(501).json({ message: 'Login endpoint not implemented' }),
        getMe: (req, res) => res.status(501).json({ message: 'GetMe endpoint not implemented' })
    };
}

// endpoints mínimos
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authController.getMe);

// Endpoint para desencriptar datos
router.post('/decrypt', (req, res) => {
  try {
    const { encryptedData } = req.body;
    if (!encryptedData) {
      return res.status(400).json({ error: 'encryptedData es requerido' });
    }
    
    const decrypted = decryptData(encryptedData);
    res.json({ decrypted });
  } catch (err) {
    console.error('Error desencriptando:', err);
    res.status(500).json({ error: 'Error al desencriptar los datos' });
  }
});

module.exports = router;