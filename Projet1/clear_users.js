const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'ecommerce_v2.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(err);
        return;
    }
    db.run("DELETE FROM users", function(err) {
        if (err) {
            console.error(err);
        } else {
            console.log(`Successfully deleted ${this.changes} user(s) from the database.`);
        }
        db.close();
    });
});
