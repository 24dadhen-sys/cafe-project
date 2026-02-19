// ==========================================
// SIPPIN'S CAFE — Admin Login Logic
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect to admin
    const token = localStorage.getItem('sippins_token');
    if (token) {
        window.location.href = '/admin.html';
    }
});

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    errorEl.style.display = 'none';

    try {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (!res.ok) {
            errorEl.textContent = data.error || 'Invalid credentials';
            errorEl.style.display = 'block';
            return;
        }

        localStorage.setItem('sippins_token', data.token);
        localStorage.setItem('sippins_admin', data.username);
        window.location.href = '/admin.html';
    } catch (err) {
        errorEl.textContent = 'Server error. Please try again.';
        errorEl.style.display = 'block';
    }
}
