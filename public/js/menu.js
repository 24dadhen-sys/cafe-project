// ==========================================
// SIPPIN'S CAFE — Customer Menu Logic
// ==========================================

const API = '';
let menuData = [];
let cart = [];
let tableNumber = '';
const socket = io();

// Category emoji icons
const CAT_ICONS = {
    'Tea': '🍵', 'Hot Coffee': '☕', 'Hot Chocolate': '🍫',
    'Cold Coffee & Frappe': '🧊', 'Breads & Bun': '🍞',
    'Snacks': '🍿', 'Puff': '🥐', 'Nachos & Chips': '🌮',
    'Pasta': '🍝', 'Desserts': '🍰', 'Waffles': '🧇',
    'Ramen': '🍜', 'Full Meal Special': '🍛', 'Hot Chocolate': '🍫'
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    const saved = sessionStorage.getItem('sippins_table');
    if (saved) {
        tableNumber = saved;
        hideTableModal();
    }

    // Table input handling
    const tableInput = document.getElementById('tableInput');
    const btnStart = document.getElementById('btnStartOrder');

    tableInput.addEventListener('input', () => {
        btnStart.disabled = !tableInput.value.trim();
    });

    tableInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && tableInput.value.trim()) {
            setTable();
        }
    });

    btnStart.addEventListener('click', setTable);

    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        renderMenu(e.target.value.trim());
    });

    // Parcel checkbox
    document.getElementById('parcelCheck').addEventListener('change', updateCartUI);

    // Load menu
    fetchMenu();

    // Socket listeners for order tracking
    socket.on('order-updated', (order) => {
        showToast(`Order #${order.orderNumber} is now ${order.status}`, 'info');
    });
});

function setTable() {
    const val = document.getElementById('tableInput').value.trim();
    if (!val) return;
    tableNumber = val;
    sessionStorage.setItem('sippins_table', tableNumber);
    hideTableModal();
}

function hideTableModal() {
    document.getElementById('tableModal').classList.add('hidden');
    document.getElementById('tableBadge').style.display = 'flex';
    document.getElementById('tableDisplay').textContent = tableNumber;
}

// ===== FETCH MENU =====
async function fetchMenu() {
    try {
        const res = await fetch(`${API}/api/menu`);
        menuData = await res.json();
        buildCategoryNav();
        renderMenu();
    } catch (err) {
        document.getElementById('menuContainer').innerHTML =
            '<div style="text-align:center;padding:40px;color:var(--danger);">Failed to load menu. Please refresh.</div>';
    }
}

// ===== CATEGORY NAV =====
function buildCategoryNav() {
    const nav = document.getElementById('categoryNav');
    nav.innerHTML = menuData.map(cat =>
        `<button class="cat-pill" onclick="scrollToCategory('${cat.category}')">${CAT_ICONS[cat.category] || '🍽️'} ${cat.category}</button>`
    ).join('');
}

function scrollToCategory(cat) {
    document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
    event.target.classList.add('active');
    const el = document.getElementById(`cat-${cat.replace(/[^a-zA-Z]/g, '')}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== RENDER MENU =====
function renderMenu(search = '') {
    const container = document.getElementById('menuContainer');
    const q = search.toLowerCase();

    let html = '';
    menuData.forEach(cat => {
        let items = cat.items;
        if (q) items = items.filter(i => i.name.toLowerCase().includes(q));
        if (items.length === 0) return;

        const catId = cat.category.replace(/[^a-zA-Z]/g, '');
        html += `
      <section class="category-section" id="cat-${catId}">
        <h2 class="category-title">
          <span class="cat-icon">${CAT_ICONS[cat.category] || '🍽️'}</span>
          ${cat.category}
        </h2>
        <div class="menu-grid">
          ${items.map(item => renderMenuCard(item)).join('')}
        </div>
      </section>
    `;
    });

    if (!html) {
        html = '<div style="text-align:center;padding:60px;color:var(--text-muted);">No items found 🔍</div>';
    }

    container.innerHTML = html;
}

function renderMenuCard(item) {
    const cartItem = findCartItem(item._id);
    const hasVariants = item.variants && item.variants.length > 0;
    const displayPrice = hasVariants ? item.variants[0].price : item.price;

    let imgHtml;
    if (item.image) {
        imgHtml = `<img src="${item.image}" alt="${item.name}">`;
    } else {
        imgHtml = `${CAT_ICONS[item.category] || '🍽️'}`;
    }

    return `
    <div class="menu-card">
      <div class="card-img">
        ${imgHtml}
        ${item.bestseller ? '<span class="bestseller-badge">⭐ Bestseller</span>' : ''}
      </div>
      <div class="card-body">
        <h3>${item.name}</h3>
        ${item.description ? `<p class="item-desc">${item.description}</p>` : '<p class="item-desc"></p>'}
        ${hasVariants ? renderVariants(item) : ''}
        <div class="card-footer">
          <span class="price"><span class="currency">₹</span>${displayPrice}</span>
          ${cartItem
            ? `<div class="qty-control">
                <button class="qty-minus" onclick="changeQty('${item._id}', '${cartItem.variant || ''}', -1)">−</button>
                <span class="qty-value">${cartItem.quantity}</span>
                <button class="qty-plus" onclick="changeQty('${item._id}', '${cartItem.variant || ''}', 1)">+</button>
              </div>`
            : hasVariants
                ? `<button class="btn-add-cart" onclick="addVariantItem('${item._id}')" id="btn-add-${item._id}">Add +</button>`
                : `<button class="btn-add-cart" onclick="addToCart('${item._id}', '', ${item.price})">Add +</button>`
        }
        </div>
      </div>
    </div>
  `;
}

function renderVariants(item) {
    return `
    <div class="variant-list" id="variants-${item._id}">
      ${item.variants.map((v, i) =>
        `<button class="variant-btn ${i === 0 ? 'selected' : ''}" 
          onclick="selectVariant('${item._id}', '${v.name}', ${v.price}, this)">${v.name} ₹${v.price}</button>`
    ).join('')}
    </div>
  `;
}

// ===== VARIANT HANDLING =====
let selectedVariants = {};

function selectVariant(itemId, variantName, price, btn) {
    selectedVariants[itemId] = { name: variantName, price };
    const container = btn.parentElement;
    container.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    // Update price display
    const card = btn.closest('.menu-card');
    const priceEl = card.querySelector('.price');
    priceEl.innerHTML = `<span class="currency">₹</span>${price}`;
}

function addVariantItem(itemId) {
    const item = findMenuItem(itemId);
    if (!item) return;
    const variant = selectedVariants[itemId] || { name: item.variants[0].name, price: item.variants[0].price };
    addToCart(itemId, variant.name, variant.price);
}

// ===== CART LOGIC =====
function findMenuItem(itemId) {
    for (const cat of menuData) {
        const found = cat.items.find(i => i._id === itemId);
        if (found) return found;
    }
    return null;
}

function findCartItem(itemId, variant) {
    return cart.find(c => c.itemId === itemId && (!variant || c.variant === variant));
}

function addToCart(itemId, variant, price) {
    const item = findMenuItem(itemId);
    if (!item) return;

    const existing = cart.find(c => c.itemId === itemId && c.variant === variant);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({
            itemId,
            name: item.name,
            variant: variant || '',
            price,
            quantity: 1
        });
    }
    showToast(`${item.name} added to cart`, 'success');
    updateCartUI();
    renderMenu(document.getElementById('searchInput').value);
}

function changeQty(itemId, variant, delta) {
    const idx = cart.findIndex(c => c.itemId === itemId && c.variant === variant);
    if (idx === -1) return;
    cart[idx].quantity += delta;
    if (cart[idx].quantity <= 0) cart.splice(idx, 1);
    updateCartUI();
    renderMenu(document.getElementById('searchInput').value);
}

function removeFromCart(itemId, variant) {
    cart = cart.filter(c => !(c.itemId === itemId && c.variant === variant));
    updateCartUI();
    renderMenu(document.getElementById('searchInput').value);
}

function updateCartUI() {
    const count = cart.reduce((s, c) => s + c.quantity, 0);
    const subtotal = cart.reduce((s, c) => s + (c.price * c.quantity), 0);
    const isParcel = document.getElementById('parcelCheck').checked;
    const parcel = isParcel ? 10 : 0;
    const total = subtotal + parcel;

    // FAB
    const fab = document.getElementById('cartFab');
    if (count > 0) {
        fab.classList.remove('hidden');
    } else {
        fab.classList.add('hidden');
    }
    document.getElementById('cartFabCount').textContent = count;
    document.getElementById('cartFabTotal').textContent = `₹${subtotal}`;

    // Drawer
    const list = document.getElementById('cartItemsList');
    if (cart.length === 0) {
        list.innerHTML = '<div class="cart-empty"><div class="empty-icon">🍽️</div><p>Your cart is empty</p></div>';
    } else {
        list.innerHTML = cart.map(c => `
      <div class="cart-item">
        <div class="cart-item-info">
          <h4>${c.name}</h4>
          ${c.variant ? `<span class="variant-label">${c.variant}</span>` : ''}
        </div>
        <div class="qty-control">
          <button class="qty-minus" onclick="changeQty('${c.itemId}', '${c.variant}', -1)">−</button>
          <span class="qty-value">${c.quantity}</span>
          <button class="qty-plus" onclick="changeQty('${c.itemId}', '${c.variant}', 1)">+</button>
        </div>
        <span class="cart-item-price">₹${c.price * c.quantity}</span>
        <button class="remove-item" onclick="removeFromCart('${c.itemId}', '${c.variant}')">✕</button>
      </div>
    `).join('');
    }

    document.getElementById('cartSubtotal').textContent = `₹${subtotal}`;
    document.getElementById('cartTotal').textContent = `₹${total}`;
    document.getElementById('btnCheckout').disabled = cart.length === 0;
}

function openCart() {
    document.getElementById('cartOverlay').classList.remove('hidden');
    document.getElementById('cartDrawer').classList.remove('hidden');
    updateCartUI();
}

function closeCart() {
    document.getElementById('cartOverlay').classList.add('hidden');
    document.getElementById('cartDrawer').classList.add('hidden');
}

// ===== PLACE ORDER =====
async function placeOrder() {
    if (cart.length === 0) return;
    if (!tableNumber) {
        showToast('Please set your table number first', 'error');
        return;
    }

    document.getElementById('loadingOverlay').classList.remove('hidden');

    try {
        const isParcel = document.getElementById('parcelCheck').checked;
        const res = await fetch(`${API}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: cart,
                tableNumber,
                isParcel
            })
        });

        if (!res.ok) throw new Error('Order failed');

        const order = await res.json();

        // Hide loading, show confirmation
        document.getElementById('loadingOverlay').classList.add('hidden');
        document.getElementById('confirmOrderNum').textContent = `#${order.orderNumber}`;
        document.getElementById('confirmTable').textContent = tableNumber;
        document.getElementById('orderConfirm').classList.remove('hidden');

        // Track this order
        socket.emit('join-customer', { orderId: order._id });

        closeCart();
    } catch (err) {
        document.getElementById('loadingOverlay').classList.add('hidden');
        showToast('Failed to place order. Try again.', 'error');
    }
}

function resetOrder() {
    cart = [];
    updateCartUI();
    document.getElementById('orderConfirm').classList.add('hidden');
    renderMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
