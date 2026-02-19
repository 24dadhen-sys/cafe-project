const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    itemId: { type: String, required: true },
    name: { type: String, required: true },
    variant: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    notes: { type: String, default: '' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderNumber: { type: Number, required: true, unique: true },
    items: [orderItemSchema],
    tableNumber: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'preparing', 'ready', 'served', 'cancelled'],
        default: 'pending'
    },
    subtotal: { type: Number, required: true },
    parcelCharges: { type: Number, default: 0 },
    total: { type: Number, required: true },
    isParcel: { type: Boolean, default: false },
    customerName: { type: String, default: '' },
    notes: { type: String, default: '' },
    statusHistory: [{
        status: String,
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

orderSchema.index({ tableNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
