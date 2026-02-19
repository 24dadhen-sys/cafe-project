const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MenuItem = require('../models/MenuItem');
const Admin = require('../models/Admin');
const Counter = require('../models/Counter');

// Full menu from Sippin's Cafe menu card
const MENU_DATA = [
    // Tea
    { name: 'Adrak Tea', category: 'Tea', price: 12 },
    { name: 'Ilaychi Tea', category: 'Tea', price: 15 },
    { name: 'Kulhad Tea', category: 'Tea', price: 15 },
    { name: 'Gud Tea', category: 'Tea', price: 20 },
    { name: 'Chocolate Tea', category: 'Tea', price: 20 },
    { name: 'Lemon Tea', category: 'Tea', price: 25 },

    // Hot Coffee
    { name: 'Classic Hot', category: 'Hot Coffee', price: 0, variants: [{ name: 'S', price: 30 }, { name: 'L', price: 80 }] },
    { name: 'Black Coffee', category: 'Hot Coffee', price: 65 },
    { name: 'French Vanilla', category: 'Hot Coffee', price: 99 },
    { name: 'Hazelnut', category: 'Hot Coffee', price: 109 },
    { name: 'Butter Scotch', category: 'Hot Coffee', price: 109 },
    { name: 'Mocha', category: 'Hot Coffee', price: 119 },

    // Cold Coffee & Frappe
    { name: 'Classic', category: 'Cold Coffee & Frappe', price: 80 },
    { name: 'Vanilla Frappe', category: 'Cold Coffee & Frappe', price: 109 },
    { name: 'Hazelnut Frappe', category: 'Cold Coffee & Frappe', price: 119 },
    { name: 'Butter Scotch Frappe', category: 'Cold Coffee & Frappe', price: 119 },
    { name: 'Mocha Frappe', category: 'Cold Coffee & Frappe', price: 119 },
    { name: 'Classic with Brownie', category: 'Cold Coffee & Frappe', price: 109 },
    { name: 'Classic with Ice Cream', category: 'Cold Coffee & Frappe', price: 119 },

    // Breads & Bun
    { name: 'Butter Toast', category: 'Breads & Bun', price: 45 },
    { name: 'Bread Jam Toast', category: 'Breads & Bun', price: 55 },
    { name: 'Garlic Bread', category: 'Breads & Bun', price: 65 },
    { name: 'Bread Pizza', category: 'Breads & Bun', price: 75 },
    { name: 'Bun Maska', category: 'Breads & Bun', price: 35 },
    { name: 'Roasted Bun Maska', category: 'Breads & Bun', price: 45 },
    { name: 'Nutella Bun', category: 'Breads & Bun', price: 60 },

    // Snacks
    { name: 'Cheese Corn Maggi', category: 'Snacks', price: 75 },
    { name: 'Korean Maggi', category: 'Snacks', price: 85 },
    { name: 'Potato Nuggets', category: 'Snacks', price: 60 },
    { name: 'Cheese Nuggets', category: 'Snacks', price: 99 },
    { name: 'Potato Wedges', category: 'Snacks', price: 75 },
    { name: 'Veggie Loaded Fries', category: 'Snacks', price: 125 },
    { name: 'Chicken Loaded Fries', category: 'Snacks', price: 145 },
    { name: 'Baked Fries', category: 'Snacks', price: 119 },
    { name: 'Chilly Potato', category: 'Snacks', price: 149 },

    // Puff
    { name: 'Veg Puff', category: 'Puff', price: 35 },
    { name: 'Veggies Loaded Puff', category: 'Puff', price: 55 },
    { name: 'Paneer Puff', category: 'Puff', price: 65 },
    { name: 'Special Puff', category: 'Puff', price: 59 },
    { name: 'Cheese Loaded Puff', category: 'Puff', price: 69 },

    // Nachos & Chips
    { name: 'Classic Cheesy', category: 'Nachos & Chips', price: 89 },
    { name: 'Spicy Salsa', category: 'Nachos & Chips', price: 99 },
    { name: 'Peri Peri', category: 'Nachos & Chips', price: 99 },
    { name: 'Tandoori', category: 'Nachos & Chips', price: 109 },
    { name: 'Mexican Loaded', category: 'Nachos & Chips', price: 119 },
    { name: 'Cheesling Chips', category: 'Nachos & Chips', price: 99 },

    // Pasta
    { name: 'Alfredo', category: 'Pasta', price: 140 },
    { name: 'Arrabbiata', category: 'Pasta', price: 120 },
    { name: 'Pink Sauce', category: 'Pasta', price: 150 },
    { name: 'Peri Peri', category: 'Pasta', price: 130 },
    { name: 'Creamy Mushrooms', category: 'Pasta', price: 159 },

    // Desserts
    { name: 'Brownie', category: 'Desserts', price: 99 },
    { name: 'Dark Brownie', category: 'Desserts', price: 119 },
    { name: 'Choco Brownie Taco', category: 'Desserts', price: 190 },
    { name: 'Chocolate Strawberry', category: 'Desserts', price: 175 },
    { name: 'Chocolate Pancake', category: 'Desserts', price: 99 },

    // Waffles
    { name: 'Classic Chocolate', category: 'Waffles', price: 79 },
    { name: 'Salted Caramel', category: 'Waffles', price: 89 },
    { name: 'Strawberry Crush', category: 'Waffles', price: 89 },
    { name: 'Oreo Crumble', category: 'Waffles', price: 99 },
    { name: 'Nutella Delight', category: 'Waffles', price: 109 },
    { name: 'Strawberry Loaded', category: 'Waffles', price: 129 },

    // Hot Chocolate
    { name: 'Classic Hot', category: 'Hot Chocolate', price: 99 },
    { name: 'Dark Hot', category: 'Hot Chocolate', price: 119 },
    { name: 'Cinnamon Hot', category: 'Hot Chocolate', price: 109 },

    // Ramen
    { name: 'Classic Soy', category: 'Ramen', price: 0, variants: [{ name: 'Paneer', price: 189 }, { name: 'Egg', price: 189 }, { name: 'Chicken', price: 199 }] },
    { name: 'Spicy Korean', category: 'Ramen', price: 0, variants: [{ name: 'Paneer', price: 189 }, { name: 'Egg', price: 189 }, { name: 'Chicken', price: 209 }] },
    { name: 'Cheesy Creamy', category: 'Ramen', price: 0, variants: [{ name: 'Paneer', price: 209 }, { name: 'Egg', price: 209 }, { name: 'Chicken', price: 229 }] },

    // Full Meal Special
    { name: 'Dal Bati', category: 'Full Meal Special', price: 99 },
    { name: 'Chicken Bati', category: 'Full Meal Special', price: 129 }
];

// Mark some bestsellers
const BESTSELLERS = [
    'Kulhad Tea', 'French Vanilla', 'Vanilla Frappe', 'Cheese Corn Maggi',
    'Alfredo', 'Classic Chocolate', 'Spicy Korean', 'Bread Pizza'
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Seed menu items (only if empty)
        const menuCount = await MenuItem.countDocuments();
        if (menuCount === 0) {
            const docs = MENU_DATA.map(item => ({
                ...item,
                available: true,
                description: '',
                image: '',
                bestseller: BESTSELLERS.includes(item.name)
            }));
            await MenuItem.insertMany(docs);
            console.log(`✅ Seeded ${docs.length} menu items`);
        } else {
            console.log(`ℹ️  Menu already has ${menuCount} items, skipping seed`);
        }

        // Create default admin (only if none exists)
        const adminCount = await Admin.countDocuments();
        if (adminCount === 0) {
            const hashedPassword = await bcrypt.hash('sippin2025', 10);
            await Admin.create({ username: 'admin', password: hashedPassword });
            console.log('✅ Created default admin → admin / sippin2025');
        } else {
            console.log('ℹ️  Admin already exists, skipping');
        }

        // Create order counter
        const counter = await Counter.findOne({ name: 'order_number' });
        if (!counter) {
            await Counter.create({ name: 'order_number', value: 1000 });
            console.log('✅ Order counter initialized at 1000');
        }

        console.log('\n🎉 Seed complete!');
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
}

seed();
