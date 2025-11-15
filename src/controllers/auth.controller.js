// src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../config/database');

exports.register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email y password requeridos' });

        const hashed = await bcrypt.hash(password, 10);
        const pool = await getPool();
        await pool.request()
        .input('email', email)
        .input('password', hashed)
        .input('name', name || null)
        .query('INSERT INTO Users (email,password,name) VALUES (@email,@password,@name)');

        res.status(201).json({ message: 'Usuario creado' });
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const pool = await getPool();
        const result = await pool.request()
        .input('email', email)
        .query('SELECT id, password FROM Users WHERE email = @email');
        const user = result.recordset[0];
        if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ message: 'Credenciales inválidas' });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
        res.json({ token });
    } catch (err) {
        next(err);
    }
};