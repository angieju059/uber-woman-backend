import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import rutasUsuarios from "./routes/usuarioRoutes.js";
import rutasAuth from "./routes/authRoutes.js";

const app = express();

// 🔧 Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static("public"));


// 🔌 Conexión a MongoDB
mongoose.connect("mongodb://localhost:27017/uberwoman")
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error de conexión:", err));

// 🚦 Rutas
app.use("/api/usuarios", rutasUsuarios);
app.use("/api/auth", rutasAuth);

// 🌐 Ruta principal
app.get("/", (req, res) => {
  res.send("🚀 Servidor backend de UberWoman corriendo correctamente");
});

// ⚙️ Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
