const mongoose = require('mongoose');

// Esquema de Producto
const productoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        minlength: [3, 'El nombre debe tener al menos 3 caracteres']
    },
    precio: {
        type: Number,
        required: [true, 'El precio es obligatorio'],
        min: [0, 'El precio no puede ser negativo']
    }
});

const Producto = mongoose.model('Producto', productoSchema);

module.exports = Producto;
