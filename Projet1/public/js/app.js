document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initRouter();
    updateCartCount();
    checkAuth();
});

const appContent = document.getElementById('app-content');
const userMenu = document.getElementById('userMenu');
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = null;

// Routing setup
function initRouter() {
    document.body.addEventListener('click', e => {
        if (e.target.matches('[data-link]') || e.target.closest('[data-link]')) {
            e.preventDefault();
            const link = e.target.matches('[data-link]') ? e.target : e.target.closest('[data-link]');
            navigateTo(link.getAttribute('href'));
        }
    });

    window.addEventListener('popstate', router);
    router();
}

function navigateTo(url) {
    history.pushState(null, null, url);
    router();
}

async function router() {
    const path = location.pathname;
    
    if (path === '/') {
        renderHome();
    } else if (path === '/products') {
        renderProducts();
    } else if (path.startsWith('/product/')) {
        const id = path.split('/')[2];
        renderProductDetail(id);
    } else if (path === '/cart') {
        renderCart();
    } else if (path === '/login') {
        renderLogin();
    } else if (path === '/register') {
        renderRegister();
    } else if (path === '/checkout') {
        renderCheckout();
    } else if (path === '/about') {
        renderAbout();
    } else if (path === '/contact') {
        renderContact();
    } else if (path === '/shipping') {
        renderShipping();
    } else if (path === '/faq') {
        renderFaq();
    } else {
        renderNotFound();
    }
}

// Pages
function renderHome() {
    appContent.innerHTML = `
        <div class="hero">
            <div class="hero-content">
                <h1>Elevate Your Everyday</h1>
                <p>Discover our curated collection of premium products designed to enhance your lifestyle with perfect balance of aesthetics and functionality.</p>
                <a href="/products" class="btn btn-primary btn-full" style="display: inline-block; width: auto; padding: 1rem 2rem; font-size: 1.125rem;" data-link>Shop Collection</a>
            </div>
            <div class="hero-image"></div>
        </div>
        <div style="margin-top: 4rem;">
            <h2>Featured Products</h2>
            <div id="featured-products" class="products-grid"></div>
        </div>
    `;
    fetchProducts(3, 'featured-products');
}

function renderProducts() {
    appContent.innerHTML = `
        <h1 style="margin-bottom: 2rem;">All Products</h1>
        <div id="all-products" class="products-grid">
            <div style="text-align:center; grid-column: 1/-1; padding: 3rem;">Loading products...</div>
        </div>
    `;
    fetchProducts(null, 'all-products');
}

async function fetchProducts(limit, containerId) {
    try {
        const res = await fetch('/api/products');
        let products = await res.json();
        if (limit) products = products.slice(0, limit);
        
        const container = document.getElementById(containerId);
        if(!container) return;
        
        container.innerHTML = products.map(p => `
            <div class="product-card">
                <a href="/product/${p.id}" data-link>
                    <img src="${p.image}" alt="${p.name}" class="product-image">
                </a>
                <div class="product-info">
                    <span class="product-category">${p.category}</span>
                    <a href="/product/${p.id}" data-link class="product-title">${p.name}</a>
                    <div class="product-price">$${p.price.toFixed(2)}</div>
                    <button class="btn btn-primary" onclick="addToCart(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.image}')">Add to Cart</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}

async function renderProductDetail(id) {
    try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error('Product not found');
        const p = await res.json();
        
        appContent.innerHTML = `
            <div class="hero" style="padding: 2rem 0; gap: 4rem;">
                <img src="${p.image}" alt="${p.name}" style="flex: 1; border-radius: 24px; width: 100%; max-width: 500px; object-fit: cover;">
                <div style="flex: 1;">
                    <span class="product-category">${p.category}</span>
                    <h1 style="margin: 0.5rem 0 1.5rem; font-size: 2.5rem;">${p.name}</h1>
                    <div class="product-price" style="font-size: 2rem; margin-bottom: 2rem;">$${p.price.toFixed(2)}</div>
                    <p style="color: var(--text-muted); font-size: 1.125rem; margin-bottom: 2rem; line-height: 1.8;">${p.description}</p>
                    <button class="btn btn-primary" style="padding: 1rem 3rem; font-size: 1.125rem;" onclick="addToCart(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.image}')">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    } catch (err) {
        appContent.innerHTML = `<h1>Product not found</h1>`;
    }
}

function renderCart() {
    if (cart.length === 0) {
        appContent.innerHTML = `
            <div class="cart-container" style="text-align: center; padding: 4rem 2rem;">
                <h2>Your cart is empty</h2>
                <p style="color: var(--text-muted); margin: 1rem 0 2rem;">Looks like you haven't added anything to your cart yet.</p>
                <a href="/products" class="btn btn-primary" data-link>Continue Shopping</a>
            </div>
        `;
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    appContent.innerHTML = `
        <h1 style="margin-bottom: 2rem;">Shopping Cart</h1>
        <div class="cart-container">
            ${cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-info">
                        <h3 style="margin-bottom: 0.5rem;">${item.name}</h3>
                        <div style="color: var(--text-muted);">$${item.price.toFixed(2)}</div>
                    </div>
                    <div class="cart-item-actions">
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                        <button class="btn btn-outline" style="margin-left: 1rem; border-color: #ef4444; color: #ef4444;" onclick="removeFromCart(${item.id})">
                            <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
            <div class="cart-summary">
                <div class="cart-total">Total: $${total.toFixed(2)}</div>
                <button class="btn btn-primary btn-full" style="max-width: 300px; margin-left: auto;" onclick="navigateTo('/checkout')">Proceed to Checkout</button>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function renderLogin() {
    appContent.innerHTML = `
        <div class="auth-container">
            <h2>Welcome Back</h2>
            <form id="loginForm" onsubmit="handleLogin(event)">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="email" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="password" class="form-control" required>
                </div>
                <button type="submit" class="btn btn-primary btn-full">Sign In</button>
            </form>
            <div class="auth-links">
                Don't have an account? <a href="/register" data-link>Sign up</a>
            </div>
        </div>
    `;
}

function renderRegister() {
    appContent.innerHTML = `
        <div class="auth-container">
            <h2>Create Account</h2>
            <form id="registerForm" onsubmit="handleRegister(event)">
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" id="regName" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="regEmail" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="regPassword" class="form-control" required minlength="6">
                </div>
                <button type="submit" class="btn btn-primary btn-full">Create Account</button>
            </form>
            <div class="auth-links">
                Already have an account? <a href="/login" data-link>Sign in</a>
            </div>
        </div>
    `;
}

function renderAbout() {
    appContent.innerHTML = `
        <div class="page-container">
            <h1>About Us</h1>
            <h2>Our Story</h2>
            <p>Welcome to MJR Bazar, where we curate premium lifestyle products designed to elevate your everyday experience. Founded with a vision to bring both aesthetics and functionality into your life, MJR Bazar is more than just a store—it's a destination for the discerning.</p>
            <p>We source only the highest quality materials and partner with top-tier manufacturers to ensure that every product meets our rigorous standards of excellence.</p>
            <h2>Our Values</h2>
            <ul>
                <li><strong>Quality First:</strong> We never compromise on craftsmanship.</li>
                <li><strong>Design-Centric:</strong> Every item is chosen for its timeless aesthetic.</li>
                <li><strong>Customer Delight:</strong> Your satisfaction is our absolute priority.</li>
            </ul>
        </div>
    `;
}

function renderContact() {
    appContent.innerHTML = `
        <div class="page-container">
            <h1>Contact Us</h1>
            <p>We're always here to help. Reach out to our dedicated support team through any of the channels below.</p>
            <h2>Get In Touch</h2>
            <p><strong>Email:</strong> support@mjrbazar.com</p>
            <p><strong>Phone:</strong> +92 3477650735</p>
            <p><strong>Hours:</strong> Monday - Saturday, 9:00 AM - 6:00 PM (PKT)</p>
            <h2>Headquarters</h2>
            <p>MJR Bazar Plaza,<br>Main Boulevard, Gulberg III<br>Lahore, 54000, Pakistan</p>
        </div>
    `;
}

function renderShipping() {
    appContent.innerHTML = `
        <div class="page-container">
            <h1>Shipping Policy</h1>
            <p>We strive to deliver your premium items as quickly and securely as possible.</p>
            <h2>Standard Shipping</h2>
            <p>Our standard shipping option takes 3-5 business days for domestic orders. Orders placed before 2 PM EST are processed on the same day.</p>
            <h2>Express Shipping</h2>
            <p>Need it faster? Choose Express Shipping at checkout to receive your items within 1-2 business days.</p>
            <h2>International Shipping</h2>
            <p>We ship globally! International transit times typically range from 7-14 business days depending on customs processing in your country.</p>
        </div>
    `;
}

function renderFaq() {
    appContent.innerHTML = `
        <div class="page-container">
            <h1>Frequently Asked Questions</h1>
            <h2>How can I track my order?</h2>
            <p>Once your order has shipped, you will receive an email containing a tracking link so you can monitor your package's journey.</p>
            <h2>What is your return policy?</h2>
            <p>We accept returns within 30 days of delivery. Items must be in their original condition and packaging. To initiate a return, please contact our support team.</p>
            <h2>Do you offer warranties?</h2>
            <p>Yes, all MJR Bazar electronics come with a standard 1-year manufacturer warranty. Furniture and accessories have a 90-day guarantee against defects.</p>
        </div>
    `;
}

// Cart Logic
window.addToCart = function(id, name, price, image) {
    const existing = cart.find(i => i.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price, image, quantity: 1 });
    }
    saveCart();
    showToast('Added to cart');
};

window.updateQuantity = function(id, change) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        saveCart();
        renderCart();
    }
};

window.removeFromCart = function(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    renderCart();
};

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = count;
}

// Auth Logic
async function checkAuth() {
    try {
        const res = await fetch('/api/user');
        const data = await res.json();
        currentUser = data.loggedIn ? data.email : null;
        updateUserMenu();
    } catch (err) {
        console.error(err);
    }
}

function updateUserMenu() {
    if (currentUser) {
        userMenu.innerHTML = `
            <span style="font-weight: 500; margin-right: 1rem; color: var(--text-muted);">${currentUser}</span>
            <button class="btn btn-outline" onclick="handleLogout()">Logout</button>
        `;
    } else {
        userMenu.innerHTML = `
            <a href="/login" class="btn btn-outline" data-link>Sign In</a>
            <a href="/register" class="btn btn-primary" data-link>Sign Up</a>
        `;
    }
}

window.handleLogin = async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (res.ok) {
            currentUser = data.email;
            updateUserMenu();
            showToast('Login successful');
            navigateTo('/');
        } else {
            showToast(data.error || 'Login failed');
        }
    } catch (err) {
        showToast('Network error');
    }
};

window.handleRegister = async function(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        
        if (res.ok) {
            showToast('Registration successful. Please log in.');
            navigateTo('/login');
        } else {
            showToast(data.error || 'Registration failed');
        }
    } catch (err) {
        showToast('Network error');
    }
};

window.handleLogout = async function() {
    await fetch('/api/logout', { method: 'POST' });
    currentUser = null;
    updateUserMenu();
    showToast('Logged out');
    navigateTo('/');
};

function renderCheckout() {
    if (cart.length === 0) {
        navigateTo('/cart');
        return;
    }
    
    if (!currentUser) {
        showToast('Please log in to checkout');
        navigateTo('/login');
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    appContent.innerHTML = `
        <div class="auth-container" style="max-width: 600px;">
            <h2>Checkout Details</h2>
            <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--bg); border-radius: 8px; color: var(--text-main); font-weight: 500;">
                Order Total: $${total.toFixed(2)}
            </div>
            <form id="checkoutForm" onsubmit="submitOrder(event)">
                <div class="form-group">
                    <label>Shipping Address</label>
                    <textarea id="orderAddress" class="form-control" required rows="4" placeholder="Enter your full shipping address"></textarea>
                </div>
                <button type="submit" class="btn btn-primary btn-full">Place Order</button>
            </form>
        </div>
    `;
}

window.submitOrder = async function(e) {
    e.preventDefault();
    const address = document.getElementById('orderAddress').value;

    try {
        const res = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart, address })
        });
        const data = await res.json();

        if (res.ok) {
            cart = [];
            saveCart();
            showToast('Order placed successfully!');
            navigateTo('/');
        } else {
            showToast(data.error || 'Checkout failed');
        }
    } catch (err) {
        showToast('Network error');
    }
};

// UI Utilities
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function renderNotFound() {
    appContent.innerHTML = `<div style="text-align:center; padding: 4rem;"><h1>404 - Page Not Found</h1></div>`;
}
