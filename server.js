require("dotenv").config();

const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const authRoute = require("./routes/auth");
const itemsRoute = require("./routes/items");
const picRoute = require("./routes/pic");

const { Pool } = require("pg");

const pool = new Pool({
    connectionString: "postgres://neondb_owner:npg_1OewPz0yGrNS@ep-autumn-star-azxb02ph-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
}); 

pool.query("SELECT version()", (err, res) => {
    if (err) {
        console.error("Gagal sambung ke Neon DB:", err);
    } else {
        console.log("Berjaya sambung ke Neon Cloud Database!");
    }
});

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

app.get("/api/records", checkLogin, (req, res) => {
    pool.query("SELECT * FROM work_content ORDER BY id DESC", (err, result) => { 
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json(result.rows);
    });
});

app.get("/api/auth/me", (req, res) => {
    if (req.session && req.session.user) {
        res.json(req.session.user);
    } else {
        res.json(null);
    }
});

app.get("/api/dashboard/stats", checkLogin, (req, res) => {
    // Membetulkan query tarikh cara PostgreSQL
    const query = `
        SELECT 
            SUM(CASE WHEN TO_CHAR(date::DATE, 'YYYY-MM') = TO_CHAR(NOW(), 'YYYY-MM') THEN 1 ELSE 0 END) as totalmonth,
            SUM(CASE WHEN TO_CHAR(date::DATE, 'WW') = TO_CHAR(NOW(), 'WW') AND TO_CHAR(date::DATE, 'YYYY') = TO_CHAR(NOW(), 'YYYY') THEN 1 ELSE 0 END) as totalweek
        FROM work_content
    `;

    pool.query(query, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        const row = result.rows[0] || {};
        res.json({
            totalMonth: parseInt(row.totalmonth) || 0,
            totalWeek: parseInt(row.totalweek) || 0
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

// SAVE NEW WORK (Dah tukar ? ke $1-$7)
app.post("/api/workcontent", checkLogin, (req, res) => {
    const { team, task, date, item, serial, pic, trains } = req.body;
    const query = "INSERT INTO work_content (team, task, date, item, serial, pic, trains) VALUES ($1, $2, $3, $4, $5, $6, $7)";
    
    pool.query(query, [team, task, date, item, serial, pic, trains], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Data Successfully saved!" });
    });
});

// SAVE ALL RECORDS
app.get("/api/workcontent", checkLogin, (req, res) => {
    pool.query("SELECT * FROM work_content ORDER BY id ASC", (err, result) => {
        if (err) { 
            return res.status(500).json({ error: err.message });
        }
        res.json(result.rows);
    });
});

// EDIT RECORDS (Dah tukar ? ke $1-$7)
app.put("/api/workcontent/:id", checkLogin, (req, res) => {
    const id = req.params.id;
    const { trains, task, date, item, serial, pic } = req.body;
    
    const query = `
        UPDATE work_content 
        SET     
            task = $1,
            date = $2,
            item = $3,
            serial = $4,
            pic = $5,
            trains = $6        
        WHERE id = $7
    `;
    
    pool.query(query, [task, date, item, serial, pic, trains, id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, message: "Record successfully updated." });
    });
});

// DELETE RECORDS (Dah tukar ? ke $1)
app.delete("/api/workcontent/:id", checkLogin, (req, res) => {
    const id = req.params.id;
    pool.query("DELETE FROM work_content WHERE id = $1", [id], (err, result) => {
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

    const query = "INSERT INTO edit_requests (record_id, username, message) VALUES ($1, $2, $3)";
    pool.query(query, [record_id, username, message], (err, result) => {
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

    pool.query("SELECT * FROM edit_requests WHERE status = 'PENDING' ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json ({ error: err.message });
        res.json(result.rows);    
    });
});

// Notification Status 
app.post("/api/edit-requests/dismiss/:id", checkLogin, (req, res) => {
    const id = req.params.id;
    pool.query("UPDATE edit_requests SET status = 'DONE' WHERE id = $1", [id], (err, result) => {
        if (err) return res.status(500).json ({ error: err.message });
        res.json({ success: true });
    });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
});