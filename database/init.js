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

// Work Content
db.run(`
    CREATE TABLE IF NOT EXISTS work_content(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trains TEXT,
    team TEXT,
    task TEXT,
    date TEXT,
    item TEXT,
    serial TEXT,
    pic TEXT
    )
    `);

//Autosave
db.run(`CREATE TABLE IF NOT EXISTS work_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task TEXT,
    date TEXT,
    items TEXT,
    serial_number TEXT,
    team_name TEXT
    )
    `);

// Admin Users
const senaraiUser = [
    { name: "Elyas", pass: "123456789", team: "Team 1"  },
    { name: "Hairez", pass: "123456789", team: "Team 1" },
    { name: "Isa",  pass: "123456789", team: "Team 1" },
    { name: "Zaid",  pass: "123456789", team: "Team 1"  },
    { name: "Farhan",  pass: "123456789", team: "Team 1"  },
    { name: "SayaAdmin1",  pass: "SayaAdmin", team: "Team 1" },
    { name: "Syafiq", pass: "123456789", team: "Team 2" },
    { name: "Hafiz", pass: "123456789", team: "Team 2" },
    { name: "Khai",  pass: "123456789", team: "Team 2" },
    { name: "Izudin",  pass: "123456789", team: "Team 2" },
    { name: "Nik",  pass: "123456789", team: "Team 2"  },
    { name: "SayaAdmin2",  pass: "SayaAdmin", team: "Team 2"  },
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

// PIC List
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

pics.forEach(pic=>{
    db.run(
    "INSERT OR IGNORE INTO person_in_charge(name, team_name) VALUES (?, ?)", [pic.name, pic.team]);
    });

}); 


db.close();
console.log("Database initialized successfully.");
