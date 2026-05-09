const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'secret-key-super-secure',
    resave: false,
    saveUninitialized: false
}));

// API Routes

app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "Name, email and password required" });

    const hashedPassword = await bcrypt.hash(password, 10);
    db.run("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, hashedPassword], function(err) {
        if (err) {
            return res.status(400).json({ error: "Registration failed. Please try again." });
        }
        res.json({ message: "Registration successful", id: this.lastID });
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: "Invalid credentials" });

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.userId = user.id;
            req.session.email = user.email;
            res.json({ message: "Login successful", email: user.email });
        } else {
            res.status(400).json({ error: "Invalid credentials" });
        }
    });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: "Logged out" });
});

app.get('/api/user', (req, res) => {
    if (req.session.userId) {
        res.json({ loggedIn: true, email: req.session.email });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/products/:id', (req, res) => {
    db.get("SELECT * FROM products WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Not found" });
        res.json(row);
    });
});

app.post('/api/checkout', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Must be logged in to checkout" });
    const { cart, address } = req.body; 
    if (!cart || cart.length === 0) return res.status(400).json({ error: "Cart is empty" });
    if (!address) return res.status(400).json({ error: "Address is required" });

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    db.run("INSERT INTO orders (user_id, total, address) VALUES (?, ?, ?)", [req.session.userId, total, address], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        const orderId = this.lastID;

        const stmt = db.prepare("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)");
        cart.forEach(item => {
            stmt.run(orderId, item.id, item.quantity, item.price);
        });
        stmt.finalize();

        res.json({ message: "Order placed successfully", orderId });
    });
});

app.get('/api/orders', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
    db.all("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", [req.session.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
