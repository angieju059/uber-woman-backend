// src/database/db.js

import mongoose from 'mongoose'; // 1. Usa 'import' para la librería

const connectDB = async () => {
    try {
        // Asegúrate de que esta variable existe en tu .env
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB conectado exitosamente!');
    } catch (error) {
        console.error('Error al conectar a MongoDB:', error.message);
        // Si hay un error, cierra el proceso de Node
        process.exit(1);
    }
};

export default connectDB; // 2. Usa 'export default' para la función