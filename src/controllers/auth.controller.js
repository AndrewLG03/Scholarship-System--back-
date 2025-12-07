// src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

exports.register = async (req, res, next) => {
    let connection;
    try {
        const { email, password, name, role } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email y password requeridos' });

        connection = await pool.getConnection();

        // comprobar si ya existe el email
        const [rows] = await connection.query('SELECT id_usuario FROM usuarios WHERE correo = ?', [email]);
        if (rows.length > 0) {
            connection.release();
            return res.status(409).json({ message: 'Email ya registrado' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const userRole = role || 'estudiante'; // Usar el rol enviado o 'estudiante' por defecto
        await connection.query('INSERT INTO usuarios (correo, password, nombre, rol) VALUES (?, ?, ?, ?)', [email, hashed, name || null, userRole]);

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
        
        // Buscar en tabla usuarios primero (admin)
        let [rows] = await connection.query('SELECT id_usuario as id, password, nombre as name, rol, correo as email FROM usuarios WHERE correo = ?', [email]);
        
        // Si no existe en usuarios, buscar en aspirantes
        if (rows.length === 0) {
            [rows] = await connection.query(
                'SELECT id_usuario as id, correo as email, CONCAT(nombre, " ", apellido1) as name FROM aspirantes WHERE correo = ? OR id_usuario = ?',
                [email, email]
            );
        }

        const user = rows[0];
        if (!user) {
            connection.release();
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Para aspirantes, el password viene en la consulta de arriba
        // Aquí validamos si es necesario
        const match = user.password ? await bcrypt.compare(password, user.password) : true;
        
        if (!match && user.password) {
            connection.release();
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name }, 
            process.env.JWT_SECRET || 'secret', 
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        
        connection.release();
        res.json({ 
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                rol: user.rol || 'estudiante'
            }
        });
    } catch (err) {
        if (connection) connection.release();
        next(err);
    }
};

/**
 * Obtener datos del usuario autenticado
 */
exports.getMe = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'No autenticado' });
        }

        const connection = await pool.getConnection();

        // Buscar en usuarios
        let [rows] = await connection.query('SELECT id_usuario as id, correo as email, nombre as name, rol FROM usuarios WHERE id_usuario = ?', [userId]);

        // Si no existe, buscar en aspirantes
        if (rows.length === 0) {
            [rows] = await connection.query(
                'SELECT id_usuario as id, correo as email, CONCAT(nombre, " ", apellido1) as name, id_aspirante FROM aspirantes WHERE id_usuario = ?',
                [userId]
            );
        }

        const user = rows[0];
        connection.release();

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({ user });
    } catch (err) {
        next(err);
    }
};
