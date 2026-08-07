const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(path.join(__dirname, "database.db"));

db.serialize(() => {

// Users
db.run(`
    CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT,
    team_name TEXT,
    UNIQUE(username, team_name)
    )
    `);

// Items
db.run(`
    CREATE TABLE IF NOT EXISTS items(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT UNIQUE
    )
    `);

// Person In Charge
db.run(`
    CREATE TABLE IF NOT EXISTS person_in_charge(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    team_name TEXT
    )
    `);

// Work Content (Updated with Finding Problem & Troubleshoot Method)
db.run(`
    CREATE TABLE IF NOT EXISTS work_content(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trains TEXT,
    team TEXT,
    task TEXT,
    date TEXT,
    item TEXT,
    serial TEXT,
    pic TEXT,
    finding_problem TEXT,
    troubleshoot_method TEXT
    )
    `);

// Admin Users
const senaraiUser = [
    { name: "10012491", pass: "123456789", team: "Team 1" },
    { name: "10019777", pass: "123456789", team: "Team 1" },
    { name: "10020169", pass: "123456789", team: "Team 1" },
    { name: "10020137", pass: "123456789", team: "Team 1" },
    { name: "10021302", pass: "123456789", team: "Team 1" },
    { name: "10013167", pass: "123456789", team: "Team 2" },
    { name: "10022645", pass: "123456789", team: "Team 2" },
    { name: "10022193", pass: "123456789", team: "Team 2" },
    { name: "10022235", pass: "123456789", team: "Team 2" },
    { name: "10022009", pass: "123456789", team: "Team 2" },
    { name: "Admin", pass: "iamAdmin", team: "All" },
];

const stmtUser = db.prepare("INSERT INTO users (username, password, team_name) VALUES (?, ?, ?)");

senaraiUser.forEach(user => {
    stmtUser.run([user.name, user.pass, user.team], (err) => {
        if (err) {
            console.error(`Failed to login ${user.name}:`, err.message);
        } else {
            console.log(`User '${user.name}' login successfully!`);
        }
    });
});

stmtUser.finalize();

// Items List
const items = [
    'PIS DATA ENTRY',
    'REPLACE',
    'SMOKE DETECTOR',
    'NCC CARD',
    'PACU CARD',
    'PEC MMI CARD',
    'DRMD&LCD PSU',
    'PEC UNIT'
];

items.forEach(item=>{
    db.run(
        "INSERT OR IGNORE INTO items(item_name) VALUES(?)", [item]);
});

// PIC
db.run("DELETE FROM person_in_charge", (err) => {
        if (err) {
            console.error("Gagal memadam PIC lama:", err.message);
            return;
        }
        
        console.log("Data PIC lama dibersihkan. Memasukkan senarai 10 orang PIC rasmi...");

        const pics = [
            { name: 'Elyas', team: 'Team 1' },
            { name: 'Hairez', team: 'Team 1' },
            { name: 'Isa', team: 'Team 1' },
            { name: 'Zaid', team: 'Team 1' },
            { name: 'Farhan', team: 'Team 1' },
            { name: 'Syafiq', team: 'Team 2' },
            { name: 'Hafiz', team: 'Team 2' },
            { name: 'Khai', team: 'Team 2' },
            { name: 'Izudin', team: 'Team 2' },
            { name: 'Nik', team: 'Team 2' },
        ];

        const stmtPic = db.prepare("INSERT INTO person_in_charge(name, team_name) VALUES (?, ?)");
        
        pics.forEach(pic => {
            stmtPic.run([pic.name, pic.team], (err) => {
                if (err) console.error(`Gagal masukkan ${pic.name}:`, err.message);
            });
        });

        stmtPic.finalize(() => {
            console.log("Semua senarai PIC rasmi berjaya dikemaskini!");
            db.close();
            console.log("Database ditutup dengan selamat.");
        });
    });

});