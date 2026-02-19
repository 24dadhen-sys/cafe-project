// ==========================================
// SIPPIN'S CAFE — Admin Dashboard Logic
// ==========================================

const TOKEN = localStorage.getItem('sippins_token');
if (!TOKEN) window.location.href = '/login.html';

const socket = io();
let allOrders = [];
let allMenuItems = [];

// Notification sound — short beep generated via Web Audio API
let audioCtx = null;
function playNotificationSound() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        // Play two ascending beeps
        [0, 150].forEach(delay => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.value = delay === 0 ? 600 : 800;
            gain.gain.value = 0.3;
            osc.start(audioCtx.currentTime + delay / 1000);
            osc.stop(audioCtx.currentTime + delay / 1000 + 0.12);
        });
    } catch (e) { /* silent fail */ }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    socket.emit('join-admin');
    loadOrders();
    loadSummary();
    loadMenuItems();

    // Real-time: new order
    socket.on('new-order', (order) => {
        playNotificationSound();
        showToast(`🔔 New order #${order.orderNumber} — Table ${order.tableNumber}`, 'info');
        loadOrders();
        loadSummary();
    });

    // Real-time: order updated
    socket.on('order-updated', () => {
        loadOrders();
        loadSummary();
    });

    // Auto refresh every 30s
    setInterval(() => {
        loadOrders();
        loadSummary();
    }, 30000);
});

// ===== AUTH HEADER =====
function authHeaders(extra = {}) {
    return { ...extra, 'Authorization': `Bearer ${TOKEN}` };
}

// ===== SIDEBAR NAV =====
function showSection(name, btn) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${name}`).classList.add('active');
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    if (btn) btn.classList.add('active');

    if (name === 'menu-mgmt') loadMenuItems();
    if (name === 'reports') loadSummary();
}

function logout() {
    localStorage.removeItem('sippins_token');
    localStorage.removeItem('sippins_admin');
    window.location.href = '/login.html';
}

// ===== LOAD ORDERS =====
async function loadOrders() {
    try {
        const status = document.getElementById('filterStatus').value;
        const table = document.getElementById('filterTable').value.trim();
        let url = `/api/admin/orders?status=${status}`;
        if (table) url += `&table=${table}`;

        const res = await fetch(url, { headers: authHeaders() });
        if (res.status === 401) return logout();
        allOrders = await res.json();
        renderOrders();
    } catch (err) {
        console.error('Load orders error:', err);
    }
}

function renderOrders() {
    const grid = document.getElementById('ordersGrid');
    if (allOrders.length === 0) {
        grid.innerHTML = `<div class="no-orders-msg"><div class="no-orders-icon">📭</div><p>No orders found</p></div>`;
        return;
    }

    grid.innerHTML = allOrders.map(order => {
        const time = new Date(order.createdAt);
        const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const ago = getTimeAgo(time);

        const statusButtons = getStatusButtons(order);

        return `
      <div class="order-card status-${order.status}">
        <div class="order-card-header">
          <div>
            <div class="order-id">#${order.orderNumber}</div>
            <div class="order-time">${timeStr} · ${ago}</div>
          </div>
          <div style="text-align:right;">
            <span class="order-table">🪑 Table ${order.tableNumber}</span>
            <div style="margin-top:6px;">
              <span class="status-badge ${order.status}">${order.status}</span>
            </div>
          </div>
        </div>
        <div class="order-items-list">
          ${order.items.map(item => `
            <div class="order-item-row">
              <span><span class="item-qty">${item.quantity}×</span> ${item.name}${item.variant ? ` (${item.variant})` : ''}</span>
              <span>₹${item.price * item.quantity}</span>
            </div>
          `).join('')}
          ${order.notes ? `<div style="font-size:0.8rem;color:var(--warning);margin-top:4px;">📝 ${order.notes}</div>` : ''}
          ${order.isParcel ? `<div style="font-size:0.75rem;color:var(--info);margin-top:4px;">📦 Parcel (+₹10)</div>` : ''}
        </div>
        <div class="order-card-footer">
          <span class="order-total">₹${order.total}</span>
          <div class="status-buttons">${statusButtons}</div>
        </div>
      </div>
    `;
    }).join('');
}

function getStatusButtons(order) {
    switch (order.status) {
        case 'pending':
            return `
        <button class="btn-status preparing" onclick="updateStatus('${order._id}', 'preparing')">🍳 Preparing</button>
        <button class="btn-status cancel" onclick="updateStatus('${order._id}', 'cancelled')">✕</button>
      `;
        case 'preparing':
            return `<button class="btn-status ready" onclick="updateStatus('${order._id}', 'ready')">✅ Ready</button>`;
        case 'ready':
            return `<button class="btn-status served" onclick="updateStatus('${order._id}', 'served')">🍽️ Served</button>`;
        default:
            return '';
    }
}

async function updateStatus(orderId, status) {
    try {
        const res = await fetch(`/api/admin/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ status })
        });
        if (res.status === 401) return logout();
        if (res.ok) {
            showToast(`Order updated to ${status}`, 'success');
            loadOrders();
            loadSummary();
        }
    } catch (err) {
        showToast('Failed to update status', 'error');
    }
}

function getTimeAgo(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ago`;
}

// ===== LOAD SUMMARY =====
async function loadSummary() {
    try {
        const res = await fetch('/api/admin/summary', { headers: authHeaders() });
        if (res.status === 401) return logout();
        const data = await res.json();

        // Order section cards
        document.getElementById('statTotal').textContent = data.totalOrders;
        document.getElementById('statRevenue').textContent = `₹${data.totalRevenue}`;
        document.getElementById('statPending').textContent = data.pending;
        document.getElementById('statPreparing').textContent = data.preparing;

        // Reports section
        document.getElementById('rptOrders').textContent = data.totalOrders;
        document.getElementById('rptRevenue').textContent = `₹${data.totalRevenue}`;
        document.getElementById('rptAvg').textContent = `₹${data.avgOrderValue}`;
        document.getElementById('rptPending').textContent = data.pending;
        document.getElementById('rptPreparing').textContent = data.preparing;
        document.getElementById('rptServed').textContent = data.served;
    } catch (err) {
        console.error('Summary error:', err);
    }
}

// ===== MENU MANAGEMENT =====
async function loadMenuItems() {
    try {
        const res = await fetch('/api/admin/menu', { headers: authHeaders() });
        if (res.status === 401) return logout();
        allMenuItems = await res.json();
        renderMenuTable();
    } catch (err) {
        console.error('Load menu error:', err);
    }
}

function renderMenuTable() {
    const body = document.getElementById('menuTableBody');
    if (allMenuItems.length === 0) {
        body.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">No menu items</td></tr>';
        return;
    }

    body.innerHTML = allMenuItems.map(item => {
        const priceStr = item.variants && item.variants.length > 0
            ? item.variants.map(v => `${v.name}: ₹${v.price}`).join(', ')
            : `₹${item.price}`;

        return `
      <tr>
        <td>
          ${item.image
                ? `<img src="${item.image}" class="item-thumb" alt="${item.name}">`
                : `<div class="item-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.2rem;background:var(--cream-dark);border-radius:8px;">🍽️</div>`
            }
        </td>
        <td><strong>${item.name}</strong></td>
        <td>${item.category}</td>
        <td>${priceStr}</td>
        <td>
          <div class="availability-toggle ${item.available ? 'on' : ''}" 
               onclick="toggleAvailability('${item._id}', ${!item.available})"></div>
        </td>
        <td>
          <button class="btn-edit" onclick='editMenuItem(${JSON.stringify(item).replace(/'/g, "\\'")})'>✏️ Edit</button>
          <button class="btn-delete" onclick="deleteMenuItem('${item._id}', '${item.name}')">🗑️</button>
        </td>
      </tr>
    `;
    }).join('');
}

async function toggleAvailability(itemId, available) {
    try {
        const formData = new FormData();
        formData.append('available', available.toString());
        const res = await fetch(`/api/admin/menu/${itemId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${TOKEN}` },
            body: formData
        });
        if (res.ok) {
            showToast(`Item ${available ? 'enabled' : 'disabled'}`, 'success');
            loadMenuItems();
        }
    } catch (err) {
        showToast('Failed to update', 'error');
    }
}

// ===== MENU MODAL =====
let editingItemId = null;

function openMenuModal(item = null) {
    editingItemId = null;
    document.getElementById('menuModalTitle').textContent = 'Add Menu Item';
    document.getElementById('menuItemForm').reset();
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('editItemId').value = '';

    if (item) {
        editingItemId = item._id;
        document.getElementById('menuModalTitle').textContent = 'Edit Menu Item';
        document.getElementById('editItemId').value = item._id;
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemCategory').value = item.category;
        document.getElementById('itemPrice').value = item.price;
        document.getElementById('itemDescription').value = item.description || '';
        if (item.image) {
            document.getElementById('imagePreview').src = item.image;
            document.getElementById('imagePreview').style.display = 'block';
        }
    }

    document.getElementById('menuModal').classList.remove('hidden');
}

function closeMenuModal() {
    document.getElementById('menuModal').classList.add('hidden');
    editingItemId = null;
}

function editMenuItem(item) {
    openMenuModal(item);
}

function previewImage(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            document.getElementById('imagePreview').src = ev.target.result;
            document.getElementById('imagePreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

async function saveMenuItem() {
    const name = document.getElementById('itemName').value.trim();
    const category = document.getElementById('itemCategory').value;
    const price = document.getElementById('itemPrice').value;
    const description = document.getElementById('itemDescription').value.trim();
    const imageFile = document.getElementById('itemImage').files[0];

    if (!name || !category) {
        showToast('Name and Category are required', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('category', category);
    formData.append('price', price || '0');
    formData.append('description', description);
    if (imageFile) formData.append('image', imageFile);

    try {
        let url = '/api/admin/menu';
        let method = 'POST';

        if (editingItemId) {
            url = `/api/admin/menu/${editingItemId}`;
            method = 'PUT';
        }

        const res = await fetch(url, {
            method,
            headers: { 'Authorization': `Bearer ${TOKEN}` },
            body: formData
        });

        if (res.ok) {
            showToast(editingItemId ? 'Item updated!' : 'Item added!', 'success');
            closeMenuModal();
            loadMenuItems();
        } else {
            const err = await res.json();
            showToast(err.error || 'Save failed', 'error');
        }
    } catch (err) {
        showToast('Server error', 'error');
    }
}

async function deleteMenuItem(itemId, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
        const res = await fetch(`/api/admin/menu/${itemId}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        if (res.ok) {
            showToast(`"${name}" deleted`, 'success');
            loadMenuItems();
        }
    } catch (err) {
        showToast('Delete failed', 'error');
    }
}

// ===== TOAST =====
function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `${icons[type] || ''} ${msg}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    // Escape closes modals
    if (e.key === 'Escape') {
        closeMenuModal();
    }
    // R to refresh orders
    if (e.key === 'r' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT') {
        loadOrders();
        loadSummary();
        showToast('Refreshed', 'info');
    }
});
