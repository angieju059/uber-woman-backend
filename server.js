// src/server.js
import dotenv from 'dotenv';
import express from 'express'; 
import connectDB from './src/Database/db.js';     
import authRoutes from './src/routes/authRoutes.js';
// --- Configuración de path para ES Modules ---
import path from 'path'; 
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// --- FIN Configuración de path ---

dotenv.config();

const app = express();
connectDB(); // Conecta a la base de datos

// Middlewares
app.use(express.json()); // Permite al servidor entender JSON en el body de las peticiones

// Servir archivos estáticos del frontend
// ASUME que 'frontend' está al mismo nivel que 'src' o en 'FINAL'
app.use(express.static(path.join(__dirname, 'Frontend')));

// Rutas de la API
app.use('/api/auth', authRoutes);

// Ruta para la página principal del frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Frontend', 'index.html'));
});

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    console.log(`Accede a la aplicación en: http://localhost:${PORT}`);
});