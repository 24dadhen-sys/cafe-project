const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Counter = require('../models/Counter');

// POST /api/orders — create a new order
router.post('/', async (req, res) => {
    try {
        const { items, tableNumber, isParcel, customerName, notes } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'No items in order' });
        }
        if (!tableNumber) {
            return res.status(400).json({ error: 'Table number is required' });
        }

        // Auto-increment order number
        const counter = await Counter.findOneAndUpdate(
            { name: 'order_number' },
            { $inc: { value: 1 } },
            { new: true, upsert: true }
        );

        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const parcelCharges = isParcel ? 10 : 0;
        const total = subtotal + parcelCharges;

        const order = new Order({
            orderNumber: counter.value,
            items,
            tableNumber,
            subtotal,
            parcelCharges,
            total,
            isParcel: isParcel || false,
            customerName: customerName || '',
            notes: notes || '',
            status: 'pending',
            statusHistory: [{ status: 'pending', timestamp: new Date() }]
        });

        await order.save();

        // Emit real-time event via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.emit('new-order', order);
        }

        res.status(201).json(order);
    } catch (err) {
        console.error('Order creation error:', err);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// GET /api/orders/:id — get order by ID for customer tracking
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).lean();
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

module.exports = router;
