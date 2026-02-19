const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Admin = require('../models/Admin');

// ========== MULTER CONFIG ==========
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', 'public', 'uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `menu-${Date.now()}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp|gif/;
        const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
        cb(ok ? null : new Error('Only image files allowed'), ok);
    }
});

// ========== AUTH ==========

// POST /api/admin/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });
        if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, admin.password);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: admin._id, username: admin.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({ token, username: admin.username });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// ========== ORDER MANAGEMENT ==========

// GET /api/admin/orders
router.get('/orders', auth, async (req, res) => {
    try {
        const query = {};
        if (req.query.status && req.query.status !== 'all') {
            query.status = req.query.status;
        }
        if (req.query.table) {
            query.tableNumber = req.query.table;
        }
        const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// PATCH /api/admin/orders/:id/status
router.patch('/orders/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            {
                status,
                $push: { statusHistory: { status, timestamp: new Date() } }
            },
            { new: true }
        );

        if (!order) return res.status(404).json({ error: 'Order not found' });

        // Emit real-time status update
        const io = req.app.get('io');
        if (io) {
            io.emit('order-updated', order);
        }

        res.json(order);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// ========== MENU MANAGEMENT ==========

// GET /api/admin/menu
router.get('/menu', auth, async (req, res) => {
    try {
        const items = await MenuItem.find().sort({ category: 1, name: 1 }).lean();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch menu' });
    }
});

// POST /api/admin/menu — add menu item with optional image
router.post('/menu', auth, upload.single('image'), async (req, res) => {
    try {
        const { name, category, price, description, variants, bestseller } = req.body;
        const item = new MenuItem({
            name,
            category,
            price: parseFloat(price) || 0,
            description: description || '',
            variants: variants ? JSON.parse(variants) : [],
            image: req.file ? `/uploads/${req.file.filename}` : '',
            bestseller: bestseller === 'true'
        });
        await item.save();
        res.status(201).json(item);
    } catch (err) {
        console.error('Add menu item error:', err);
        res.status(500).json({ error: 'Failed to add item' });
    }
});

// PUT /api/admin/menu/:id — update menu item
router.put('/menu/:id', auth, upload.single('image'), async (req, res) => {
    try {
        const updates = {};
        const { name, category, price, description, variants, available, bestseller } = req.body;
        if (name !== undefined) updates.name = name;
        if (category !== undefined) updates.category = category;
        if (price !== undefined) updates.price = parseFloat(price);
        if (description !== undefined) updates.description = description;
        if (variants !== undefined) updates.variants = JSON.parse(variants);
        if (available !== undefined) updates.available = available === 'true';
        if (bestseller !== undefined) updates.bestseller = bestseller === 'true';
        if (req.file) updates.image = `/uploads/${req.file.filename}`;

        const item = await MenuItem.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// DELETE /api/admin/menu/:id
router.delete('/menu/:id', auth, async (req, res) => {
    try {
        const item = await MenuItem.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        // Delete image file if exists
        if (item.image) {
            const imgPath = path.join(__dirname, '..', 'public', item.image);
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }
        res.json({ message: 'Item deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

// ========== REPORTS ==========

// GET /api/admin/summary
router.get('/summary', auth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayOrders = await Order.find({
            createdAt: { $gte: today, $lt: tomorrow }
        }).lean();

        const totalOrders = todayOrders.length;
        const totalRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
        const pending = todayOrders.filter(o => o.status === 'pending').length;
        const preparing = todayOrders.filter(o => o.status === 'preparing').length;
        const ready = todayOrders.filter(o => o.status === 'ready').length;
        const served = todayOrders.filter(o => o.status === 'served').length;

        res.json({
            date: today.toISOString().split('T')[0],
            totalOrders,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            pending,
            preparing,
            ready,
            served,
            avgOrderValue: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

module.exports = router;
