const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'ecommerce_v2.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
    } else {
        console.log("Connected to the SQLite database.");
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            password TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            description TEXT,
            price REAL,
            image TEXT,
            category TEXT
        )`, (err) => {
            if (!err) {
                db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
                    if (row && row.count === 0) {
                        const stmt = db.prepare("INSERT INTO products (name, description, price, image, category) VALUES (?, ?, ?, ?, ?)");
                        stmt.run("Premium Wireless Headphones", "Experience pure sound with noise-canceling technology.", 199.99, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=60", "Electronics");
                        stmt.run("Minimalist Smartwatch", "Track your life with style and precision.", 149.50, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=60", "Electronics");
                        stmt.run("Ergonomic Desk Chair", "Comfort for those long working hours.", 249.00, "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=500&q=60", "Furniture");
                        stmt.run("Mechanical Keyboard", "Tactile feedback and RGB backlighting.", 120.00, "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=500&q=60", "Electronics");
                        stmt.run("Modern Table Lamp", "Warm lighting for a cozy room.", 45.00, "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=500&q=60", "Home");
                        stmt.run("Canvas Backpack", "Durable and stylish for everyday use.", 55.99, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=500&q=60", "Accessories");
                        stmt.finalize();
                    }
                });
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            total REAL,
            address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER,
            product_id INTEGER,
            quantity INTEGER,
            price REAL,
            FOREIGN KEY (order_id) REFERENCES orders (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
        )`);
    }
});

module.exports = db;
