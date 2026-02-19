const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');

const CATEGORY_ORDER = [
    'Tea', 'Hot Coffee', 'Hot Chocolate', 'Cold Coffee & Frappe',
    'Breads & Bun', 'Snacks', 'Puff', 'Nachos & Chips',
    'Pasta', 'Desserts', 'Waffles', 'Ramen', 'Full Meal Special'
];

// GET /api/menu — public menu grouped by category
router.get('/', async (req, res) => {
    try {
        const items = await MenuItem.find({ available: true }).lean();
        const categoryMap = {};
        items.forEach(item => {
            if (!categoryMap[item.category]) categoryMap[item.category] = [];
            categoryMap[item.category].push({
                _id: item._id,
                name: item.name,
                category: item.category,
                price: item.price,
                variants: item.variants || [],
                description: item.description,
                image: item.image,
                bestseller: item.bestseller
            });
        });

        const result = [];
        CATEGORY_ORDER.forEach(cat => {
            if (categoryMap[cat]) {
                result.push({ category: cat, items: categoryMap[cat] });
                delete categoryMap[cat];
            }
        });
        // Any remaining categories not in the predefined order
        Object.keys(categoryMap).forEach(cat => {
            result.push({ category: cat, items: categoryMap[cat] });
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch menu' });
    }
});

// GET /api/menu/search?q=keyword
router.get('/search', async (req, res) => {
    try {
        const q = req.query.q || '';
        const items = await MenuItem.find({
            available: true,
            name: { $regex: q, $options: 'i' }
        }).lean();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: 'Search failed' });
    }
});

module.exports = router;
