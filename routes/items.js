const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database/database.db");

// GET ITEMS
router.get("/", (req, res) => {
    db.all("SELECT * FROM items ORDER BY item_name ASC", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

module.exports = router;