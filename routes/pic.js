const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "..", "database", "database.db");
const db = new sqlite3.Database(dbPath);

// GET PIC
router.get("/", (req, res) => {
    let team = req.query.team;
    
    if (team) {
        // Normalize incoming string formatting if necessary
        team = team.replace(/['"]+/g, '').trim(); 
        
        db.all("SELECT * FROM person_in_charge WHERE team_name = ? ORDER BY name ASC", [team], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            return res.json(rows);
        });
    } else {
        db.all("SELECT * FROM person_in_charge ORDER BY name ASC", [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            return res.json(rows);
        });
    }
});

module.exports = router;