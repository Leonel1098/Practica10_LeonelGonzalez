const express = require('express');
const Inventario = require('../models/Inventario');
const router = express.Router();

// Crea la ruta para GET /productos: Devuelve todos los productos
router.get('/', async (req, res) => {
    try {
        const productos = await Inventario.find();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Crea la ruta para POST /productos: Agrega un nuevo producto
router.post('/', async (req, res) => {
    const { nombre, precio } = req.body;

    // Validar que los campos no estén vacíos
    if (!nombre || !precio) {
        return res.status(400).json({ message: 'El nombre y el precio son obligatorios' });
    }

    try {
        const nuevoProducto = new Inventario({ nombre, precio });
        await nuevoProducto.save();
        res.status(201).json(nuevoProducto);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Crea la ruta pra PUT /productos/:id: Actualiza un producto por su ID
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, precio } = req.body;

    if (!nombre || !precio) {
        return res.status(400).json({ message: 'El nombre y el precio son obligatorios' });
    }

    try {
        const productoActualizado = await Inventario.findByIdAndUpdate(
            id,
            { nombre, precio },
            { new: true, runValidators: true }
        );

        if (!productoActualizado) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        res.json(productoActualizado);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

//Crea la ruta para DELETE /productos/:id: Elimina un producto por su ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const productoEliminado = await Inventario.findByIdAndDelete(id);

        if (!productoEliminado) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
