// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    console.log('[AUTH MIDDLEWARE] Verificando autenticación');
    console.log('[AUTH MIDDLEWARE] Authorization header:', authHeader ? 'Presente' : 'AUSENTE');
    
    if (authHeader) {
        console.log('[AUTH MIDDLEWARE] Header value (primeros 30 chars):', authHeader.substring(0, 30) + '...');
    }
    
    if (!authHeader) {
        console.log('[AUTH MIDDLEWARE] ❌ No token encontrado');
        return res.status(401).json({ message: 'No token' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    
    console.log('[AUTH MIDDLEWARE] Token extraído (primeros 20 chars):', token.substring(0, 20) + '...');
    
    try {
        const jwtSecret = process.env.JWT_SECRET || 'secret';
        const payload = jwt.verify(token, jwtSecret);
        console.log('[AUTH MIDDLEWARE] ✅ Token válido. Usuario ID:', payload.id);
        req.user = payload;
        next();
    } catch (err) {
        console.log('[AUTH MIDDLEWARE] ❌ Token inválido:', err.message);
        return res.status(401).json({ message: 'Token inválido' });
    }
};