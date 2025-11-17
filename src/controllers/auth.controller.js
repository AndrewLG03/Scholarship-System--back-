
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

// REGISTRO
async function register(req, res) {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email y password requeridos" });
        }

        const hashed = await bcrypt.hash(password, 10);

        await pool.query(
            `INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, 'aspirante')`,
            [email, hashed, name]
        );

        res.status(201).json({ message: "Usuario registrado" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error registrando usuario" });
    }
}

// LOGIN
async function login(req, res) {
    try {
        const { email, password } = req.body;

        const [rows] = await pool.query(
            `SELECT id, password, role FROM users WHERE email = ?`,
            [email]
        );

        if (!rows.length) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({ token, role: user.role });

    } catch (error) {
        res.status(500).json({ message: "Error iniciando sesión" });
    }
}

module.exports = { register, login };
