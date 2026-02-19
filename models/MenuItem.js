const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true }
}, { _id: false });

const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, default: 0 },
    variants: [variantSchema],
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    available: { type: Boolean, default: true },
    bestseller: { type: Boolean, default: false }
}, { timestamps: true });

menuItemSchema.index({ category: 1 });
menuItemSchema.index({ name: 'text' });

module.exports = mongoose.model('MenuItem', menuItemSchema);
