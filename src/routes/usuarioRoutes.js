// src/routes/usuarioRoutes.js

import { Router } from 'express'; 
import * as usuarioController from '../controllers/usuarioController.js'; // Ruta al controlador

const router = Router();

// Rutas de Usuario (CRUD)
// 🛑 Usamos los nombres en español definidos en usuarioController.js 🛑
router.post('/', usuarioController.crearUsuario);          // POST para crear usuario
router.get('/', usuarioController.obtenerUsuarios);        // GET para obtener todos
router.get('/:id', usuarioController.obtenerUsuarioPorId); // GET para obtener por ID
router.put('/:id', usuarioController.actualizarUsuario);    // PUT para actualizar
router.delete('/:id', usuarioController.eliminarUsuario);  // DELETE para eliminar

export default router;