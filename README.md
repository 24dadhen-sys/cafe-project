# ☕ Sippin's Cafe — Digital Ordering System

A complete QR-based cafe ordering system with real-time order tracking, admin dashboard, and menu management.

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+
- **MongoDB** running locally or MongoDB Atlas URI

### 1. Install & Configure
```bash
cd sippins-cafe
npm install
```

Edit `.env` to set your MongoDB connection:
```
PORT=3000
MONGO_URI=mongodb://localhost:27017/sippins_cafe
JWT_SECRET=sippins-cafe-jwt-secret-2025
```

### 2. Seed Database
```bash
npm run seed
```
This seeds all 71 menu items and creates the default admin account.

### 3. Start Server
```bash
npm start
```

### 4. Open in Browser
- **Customer Menu**: http://localhost:3000
- **Admin Login**: http://localhost:3000/login.html
- **Admin Dashboard**: http://localhost:3000/admin.html

### Default Admin Login
- Username: `admin`
- Password: `sippin2025`

---

## 📂 Project Structure

```
sippins-cafe/
├── server.js              # Express + Socket.io entry point
├── .env                   # Environment variables
├── config/db.js           # MongoDB connection
├── models/
│   ├── MenuItem.js        # Menu item schema
│   ├── Order.js           # Order schema
│   ├── Admin.js           # Admin user schema
│   └── Counter.js         # Order number counter
├── routes/
│   ├── menu.js            # Public menu API
│   ├── orders.js          # Order creation API
│   └── admin.js           # Admin CRUD + auth
├── middleware/auth.js     # JWT middleware
├── seed/menuSeed.js       # Database seeder
└── public/
    ├── index.html         # Customer menu page
    ├── login.html         # Admin login
    ├── admin.html         # Admin dashboard
    ├── css/style.css      # Premium cafe theme
    ├── js/
    │   ├── menu.js        # Customer logic
    │   ├── admin.js       # Admin logic
    │   └── login.js       # Login logic
    └── uploads/           # Menu item images
```

---

## ✨ Features

### Customer Side
- 📱 QR code accessible menu (mobile-first)
- 🪑 Table number entry before ordering
- 🔍 Search menu items
- 🛒 Full cart system with variant selection
- ⏳ Loading animation when placing orders
- 📊 Real-time order status tracking

### Admin Side
- 📋 Real-time order counter (Socket.io)
- 🔔 Sound notification on new orders
- 🍳 Status progression: Pending → Preparing → Ready → Served
- 🔍 Filter orders by table number or status
- 🍔 Full menu CRUD (Add/Edit/Delete with image upload)
- 📸 Toggle item availability (out of stock)
- 📊 Daily summary & reports

### Design
- 🎨 Cream/brown/beige cafe theme
- ✨ Smooth hover animations & transitions
- 📐 Card-style menu layout
- 📱 Fully mobile responsive
- 🌓 Glassmorphism sidebar

---

## 🌐 Free Deployment

### Option 1: Render.com
1. Push code to GitHub
2. Go to [render.com](https://render.com), create a **Web Service**
3. Connect your repo, set:
   - Build: `npm install`
   - Start: `node server.js`
4. Add environment variables in Render dashboard
5. Use MongoDB Atlas for database

### Option 2: Railway.app
1. Push to GitHub
2. Go to [railway.app](https://railway.app), create new project
3. Add MongoDB plugin + Node.js service
4. Set environment variables
5. Deploy automatically

### Option 3: Cyclic.sh
1. Connect GitHub repo at [cyclic.sh](https://cyclic.sh)
2. Set environment variables
3. Deploy in one click

### MongoDB Atlas (Free Cloud DB)
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create free M0 cluster
3. Get connection string, update `.env`:
   ```
   MONGO_URI=mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/sippins_cafe
   ```

---

## 📋 API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/menu` | No | Get public menu |
| GET | `/api/menu/search?q=` | No | Search items |
| POST | `/api/orders` | No | Place order |
| GET | `/api/orders/:id` | No | Track order |
| POST | `/api/admin/login` | No | Admin login |
| GET | `/api/admin/orders` | Yes | List orders |
| PATCH | `/api/admin/orders/:id/status` | Yes | Update status |
| GET | `/api/admin/menu` | Yes | All menu items |
| POST | `/api/admin/menu` | Yes | Add item |
| PUT | `/api/admin/menu/:id` | Yes | Edit item |
| DELETE | `/api/admin/menu/:id` | Yes | Delete item |
| GET | `/api/admin/summary` | Yes | Daily stats |

---

## 💡 Professional Suggestions Implemented

### 5 UX Improvements
1. **Order progress tracking** — customers see live status updates
2. **Category quick nav** — floating pills for fast browsing
3. **Bestseller badges** — highlights popular items
4. **Search functionality** — instant menu search
5. **Parcel option** — takeaway with extra charges

### 2 Sales Boosters
1. **Bestseller labels** — drives popular item sales
2. **Variant pricing** — upsell via size options (S/L for coffee)

### 3 Admin Efficiency
1. **Keyboard shortcuts** — R to refresh, Esc to close modals
2. **Dashboard summary cards** — instant KPI visibility
3. **Toggle availability** — quickly mark items out of stock

---

Built with ❤️ for Sippin's Cafe — Estd. 2025
