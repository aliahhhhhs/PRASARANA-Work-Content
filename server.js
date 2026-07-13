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
        res.json({ success: true, message: "Data berjaya disimpan!" });
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
        res.json({ success: true, message: "Rekod berjaya dikemaskini." });
    });
});

// DELETE RECORDS
app.delete("/api/workcontent/:id", checkLogin, (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM work_content WHERE id = ?", [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Rekod dipadam." });
    });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
});