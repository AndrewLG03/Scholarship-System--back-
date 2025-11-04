// src/config/email.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: Number(process.env.EMAIL_PORT) === 465, // TRUE
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// VERIFICACION
transporter.verify().then(() => {
    console.log('Email transporter listo');
    }).catch(err => {
    console.warn('No se pudo verificar el transporter de email (dev env ok):', err.message);
});

module.exports = transporter;
