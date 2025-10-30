// src/routes/authRoutes.js

import { Router } from 'express'; 
import * as authController from '../controllers/authController.js'; // Ruta al controlador

const router = Router();

// Rutas de Autenticación
// 🛑 Usamos los nombres en español que el controlador DEBE exportar 🛑
router.post('/registro', authController.registrarUsuario); // Asumiendo que esta es la función
router.post('/login', authController.iniciarSesion);      // Asumiendo que esta es la función de login

export default router;