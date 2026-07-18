const itemsRoute = require("./routes/items");
const picRoute = require("./routes/pic");
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const authRoute = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

app.use(
    session({
        secret: "prasarana_secret_key",
        resave: false,
        saveUninitialized: true,
        cookie: {secure: false}
    })
);

const db = new sqlite3.Database("./database/database.db");

db.serialize(() => {
    db.run("ALTER TABLE work_content ADD COLUMN trains TEXT", (err) => {
        if (err) {
        } else {
            console.log("'Trains' column successfully added.");
        }
    });

    db.run(`
    CREATE TABLE IF NOT EXISTS edit_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        record_id INTEGER,
        username TEXT,
        message TEXT,
        status TEXT DEFAULT 'PENDING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

// PROTECT PAGE
function checkLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/login.html")
    }
    next();
}

app.get("/dashboard.html", checkLogin, (req, res) =>{
    res.sendFile(path.join(__dirname, "public/dashboard.html"));
});

app.get("/records.html", checkLogin, (req, res) =>{
    res.sendFile(path.join(__dirname, "public/records.html"));
});

// API ROUTES
app.get("/api/records", checkLogin, (req, res) => {
    db.all(
        "SELECT * FROM work_content ORDER BY id DESC", [], 
        (err, rows) => { 
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json(rows);
         }        
    );
});

app.get("/api/auth/me", (req, res) => {
    if (req.session && req.session.user) {
        res.json(req.session.user);
    } else {
        res.json(null);
    }
});

app.get("/api/dashboard/stats", checkLogin, (req, res) => {
    const query = `
        SELECT 
            SUM(CASE WHEN strftime('%Y-%m', date) = strftime('%Y-%m', 'now') THEN 1 ELSE 0 END) as totalMonth,
            SUM(CASE WHEN strftime('%W', date) = strftime('%W', 'now') AND strftime('%Y', date) = strftime('%Y', 'now') THEN 1 ELSE 0 END) as totalWeek
        FROM work_content
    `;

    db.get(query, [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
            totalMonth: row.totalMonth || 0,
            totalWeek: row.totalWeek || 0
        });
    });
});

// Static files
app.use("/", express.static(path.join(__dirname, "public")));

// Home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use("/auth", authRoute);
app.use("/api/items", itemsRoute);
app.use("/api/pic", picRoute);

// SAVE NEW WORK 
app.post("/api/workcontent", checkLogin, (req, res) => {
    const { team, task, date, item, serial, pic, trains } = req.body;
    const query = "INSERT INTO work_content (team, task, date, item, serial, pic, trains) VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    db.run(query, [team, task, date, item, serial, pic, trains], function(err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Data Successfully saved!" });
    });
});

// SAVE ALL RECORDS
app.get("/api/workcontent", checkLogin, (req, res) => {
    db.all("SELECT * FROM work_content ORDER BY id ASC", [], (err, rows) => {
        if (err) { 
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
        });
});

// EDIT RECORDS
app.put("/api/workcontent/:id", checkLogin, (req, res) => {
    const id = req.params.id;
    const { trains, task, date, item, serial, pic } = req.body;
    
    const query = `
        UPDATE work_content 
        SET     
            task = COALESCE(NULLIF(?, ''), task),
            date = COALESCE(NULLIF(?, ''), date),
            item = COALESCE(NULLIF(?, ''), item),
            serial = COALESCE(NULLIF(?, ''), serial),
            pic = COALESCE(NULLIF(?, ''), pic),
            trains = COALESCE(NULLIF(?, ''), trains)        
        WHERE id = ?
    `;
    
    db.run(query, [task, date, item, serial, pic, trains, id], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, message: "Record successfully updated." });
    });
});

// DELETE RECORDS
app.delete("/api/workcontent/:id", checkLogin, (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM work_content WHERE id = ?", [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Record deleted." });
    });
});

// Ask For Edit
app.post("/api/edit-requests", checkLogin, (req, res) => {
    const { record_id, message } = req.body;
    const username = req.session.user ? req.session.user.username : "User";

    if (!record_id || !message) {
        return res.status(400).json({ success: false, message: "Incomplete data."});
    }

    const query = "INSERT INTO edit_requests (record_id, username, message) VALUES (?, ?, ?)";
    db.run(query, [record_id, username, message], function(err) {
        if (err) return res.status(500).json({success: false, message: err.message});
        res.json ({ success: true, message: "Notification has been sent to Admin." });
    });
});

// Take Requests (Admin Only)
app.get("/api/edit-requests", checkLogin, (req, res) => {
    const currentUser = req.session.user;
    const isAdmin = currentUser && (currentUser.username === "SayaAdmin1" || currentUser.username === "SayaAdmin2");

    if (!isAdmin) {
        return res.status(403).json ({ success: false, message: "Access Denied."});
    }

    db.all("SELECT * FROM edit_requests WHERE status = 'PENDING' ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json ({ error: err.message });
        res.json(rows);    
    });
});

// Notification Status 
app.post("/api/edit-requests/dismiss/:id", checkLogin, (req, res) => {
    const id = req.params.id;
    db.run("UPDATE edit_requests SET status = 'DONE' WHERE id = ?", [id], function(err) {
        if (err) return res.status(500).json ({ error: err.message });
    res.json({ success: true });
    });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
});