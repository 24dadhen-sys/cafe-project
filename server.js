require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] }
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('join-admin', () => {
        socket.join('admin-room');
        console.log(`👨‍💼 Admin joined: ${socket.id}`);
    });

    socket.on('join-customer', (data) => {
        if (data && data.orderId) {
            socket.join(`order-${data.orderId}`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
    });
});

// Connect to DB and start server
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`\n☕ Sippin's Cafe server running on http://localhost:${PORT}`);
        console.log(`📱 Customer Menu: http://localhost:${PORT}`);
        console.log(`🔐 Admin Panel:   http://localhost:${PORT}/login.html`);
        console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin.html\n`);
    });
});
