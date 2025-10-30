// src/controllers/authController.js

import Usuario from '../models/Usuario.js'; // Ruta relativa a tu modelo
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 🛑 IMPORTANTE: Asegúrate de que esta variable exista en tu archivo .env
const JWT_SECRET = process.env.JWT_SECRET; 

/**
 * Registra un nuevo usuario (Usuaria o Conductora).
 * Se llama desde router.post('/registro', authController.registrarUsuario)
 */
export const registrarUsuario = async (req, res) => {
    // Extraemos los campos del cuerpo de la petición
    const { nombre, email, password, role, telefono, detallesConductora } = req.body;

    // Validación básica
    if (!nombre || !email || !password || !role) {
        return res.status(400).json({ msg: 'Faltan campos obligatorios para el registro.' });
    }

    try {
        // 1. Verificar si el usuario ya existe
        let user = await Usuario.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'El usuario ya existe con ese correo.' });
        }

        // 2. Crear nueva instancia de Usuario
        user = new Usuario({
            nombre,
            email,
            password, // Mongoose lo guardará como 'password'
            role,
            telefono,
            // Solo guarda detalles si el rol es 'conductora'
            detallesConductora: role === 'conductora' ? detallesConductora : undefined 
        });

        // 3. Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // 4. Guardar en la base de datos
        await user.save();

        // 5. Crear Token de Seguridad (JWT) para mantener la sesión
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1h' }, // El token expira en 1 hora
            (err, token) => {
                if (err) throw err;
                res.status(201).json({ 
                    mensaje: `✅ Registro de ${role} exitoso`, 
                    token, 
                    usuario: { id: user.id, nombre: user.nombre, role: user.role } 
                });
            }
        );

    } catch (err) {
        console.error("Error al registrar usuario:", err.message);
        res.status(500).send('❌ Error en el servidor durante el registro');
    }
};

/**
 * Maneja el inicio de sesión del usuario.
 * Se llama desde router.post('/login', authController.iniciarSesion)
 */
export const iniciarSesion = async (req, res) => {
    const { email, password } = req.body;

    // Validación básica
    if (!email || !password) {
        return res.status(400).json({ msg: 'Debe ingresar email y contraseña.' });
    }
    
    try {
        // 1. Verificar si el usuario existe
        let user = await Usuario.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Credenciales inválidas.' });
        }

        // 2. Comparar la contraseña ingresada con la encriptada
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales inválidas.' });
        }

        // 3. Crear y devolver el Token de Seguridad (JWT)
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1h' }, 
            (err, token) => {
                if (err) throw err;
                res.json({ 
                    mensaje: `✅ Inicio de sesión exitoso como ${user.role}`, 
                    token, 
                    usuario: { id: user.id, nombre: user.nombre, role: user.role } 
                });
            }
        );

    } catch (err) {
        console.error("Error al iniciar sesión:", err.message);
        res.status(500).send('❌ Error en el servidor durante el login');
    }
};