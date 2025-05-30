// Carga los módulos necesarios para crear el servidor
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Permite el uso de variables de entorno desde un archivo .env

// Importa los archivos de rutas que agrupan la lógica de usuarios, pagos y administración
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000; // Define el puerto, configurable por variable de entorno

// Habilita CORS para permitir peticiones desde otros orígenes (por ejemplo, desde el frontend)
app.use(cors());

// Permite que el servidor acepte y procese datos en formato JSON en las peticiones
app.use(express.json());

// Monta las rutas de usuarios bajo el prefijo /api/user
app.use('/api/user', userRoutes);

// Monta las rutas de pagos y transacciones bajo el prefijo /api/payment
app.use('/api/payment', paymentRoutes);

// Monta las rutas de administración bajo el prefijo /api/admin
app.use('/api/admin', adminRoutes); 

// Inicia el servidor y lo deja escuchando en el puerto definido
// 0.0.0.0 permite conexiones desde cualquier red
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en 0.0.0.0:${PORT}`);
});









