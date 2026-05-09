const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'ecommerce.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(err);
        return;
    }
    db.serialize(() => {
        db.run('DROP TABLE IF EXISTS users');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            password TEXT
        )`, (err) => {
            if (err) console.error("Error creating:", err);
            else console.log("Success! Users table recreated without UNIQUE constraint.");
        });
    });
});
