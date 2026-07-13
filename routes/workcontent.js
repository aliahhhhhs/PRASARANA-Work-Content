const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database/database.db");

// SAVE WORK CONTENT
router.post("/", (req, res) => {
    const { team, task, date, item, serial, pic } = req.body;

    db.run(
        `INSERT INTO work_content (team, task, date, item, serial, pic) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [team, task, date, item, serial, pic],
        function (err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }
            res.json({
                success: true,
                message: "Work Content Saved Successfully!"
            });
        }
    );
});

// API GET RECORDS
router.get("/", (req, res) => {
    db.all(
        "SELECT * FROM work_content ORDER BY id DESC", [], 
        (err, rows) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }
            res.json(rows);
         }        
    );
});

// DELETE API 
router.delete("/:id", (req, res) => {
    const id = req.params.id;

    db.run(
        "DELETE FROM work_content WHERE id=?",
        [id],
        function (err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }
            res.json({
                success: true,
                message: "Recors deleted"
            });
        }
    );
});

// EDIT RECORD
router.put("/:id", (req, res) =>{
    const {id} = req.params;
    const {task, date, item, serial, pic} = req.body;

    db.run(
        `UPDATE work_content
        SET task=?, date=?, item=?, serial=?, pic=?
        WHERE id=?`,
        [task, date, item, serial, pic, id],
        function (err) {
            if (err){
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }
            res.json({
                success: true,
                messsage: "Record Updated"
            });
        }
    );
});

module.exports = router;