// src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

exports.register = async (req, res, next) => {
    let connection;
    try {
        const { email, password, name } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email y password requeridos' });

        connection = await pool.getConnection();

        // comprobar si ya existe el email
        const [rows] = await connection.query('SELECT id FROM Users WHERE email = ?', [email]);
        if (rows.length > 0) {
            connection.release();
            return res.status(409).json({ message: 'Email ya registrado' });
        }

        const hashed = await bcrypt.hash(password, 10);
        await connection.query('INSERT INTO Users (email, password, name) VALUES (?, ?, ?)', [email, hashed, name || null]);

        connection.release();
        res.status(201).json({ message: 'Usuario creado' });
    } catch (err) {
        if (connection) connection.release();
        next(err);
    }
};

exports.login = async (req, res, next) => {
    let connection;
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email y password requeridos' });

        connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT id, password FROM Users WHERE email = ?', [email]);
        const user = rows[0];
        if (!user) {
            connection.release();
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            connection.release();
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
        connection.release();
        res.json({ token });
    } catch (err) {
        if (connection) connection.release();
        next(err);
    }
};