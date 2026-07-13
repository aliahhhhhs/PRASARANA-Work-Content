const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database/database.db");

router.post("/login", (req, res) =>{
    const { username, password, team } = req.body;

    db.get(
        "SELECT * FROM users WHERE username=? AND password=? AND team_name=?",
        [username, password, team],
        (err, row) => {
            if (err) {
                return res.status(500).json({
                    success: false });
            }
            if (!row) {
                return res.json({
                    success: false,
                    message: `Akaun tidak ditemui bagi ${team} atau kata laluan salah.`
                });
            }
            req.session.user = row;
            req.session.save(() => { 
                res.json({success: true });
            });
            
        }
    );
});

router.get("/logout", (req, res) =>{
    req.session.destroy(() =>{
        res.redirect("/login.html");
    });
});

module.exports = router;
