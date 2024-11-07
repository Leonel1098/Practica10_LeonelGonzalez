const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const productosRoutes = require('./routes/productos');

const app = express();
const PORT = process.env.PORT || 3000;

// Conexión a la base de datos MongoDB Atlas 
mongoose.connect('mongodb+srv://gonzalezleonel1098:Leonel10@cluster0.uapuf.mongodb.net/Inventario')
    .then(() => console.log('Conexión a MongoDB exitosa'))
    .catch((error) => console.error('Error de conexión a MongoDB:', error));

//sirve para manejar el cuerpo del json que se usa en postman
app.use(bodyParser.json());

// Rutas
app.use('/productos', productosRoutes);

// Iniciar el servidor en el puerto definido arriba
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
