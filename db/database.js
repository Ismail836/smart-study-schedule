/* =========================================================
   Smart Study Schedule — Database layer
   Uses better-sqlite3 to persist the weekly plan in a real
   SQLite database (db/schedule.db) instead of localStorage.
   ========================================================= */

const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "schedule.db");
const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");

// One row per planned hour-block. (day, hour) is unique — a student
// can only have one task in a given slot, same rule the old
// localStorage version enforced with its "day-hour" key.
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    day      TEXT    NOT NULL,
    hour     INTEGER NOT NULL,
    subject  TEXT    NOT NULL,
    priority TEXT    NOT NULL DEFAULT 'medium',
    notes    TEXT    DEFAULT '',
    UNIQUE(day, hour)
  );
`);

// Seed a few example blocks the first time the database is created,
// so the grid isn't empty on a fresh install (mirrors the old
// seedIfFirstVisit() behaviour from schedule.js).
const count = db.prepare("SELECT COUNT(*) AS n FROM tasks").get().n;
if (count === 0) {
  const seed = db.prepare(
    "INSERT INTO tasks (day, hour, subject, priority, notes) VALUES (?, ?, ?, ?, ?)"
  );
  const seedData = [
    ["Mon", 9, "Data Structures", "high", "Chapter 4 — trees"],
    ["Mon", 19, "Revision", "low", ""],
    ["Wed", 14, "Web Technologies", "medium", "Bootstrap grid practice"],
    ["Fri", 10, "Database Systems", "high", "Normalization"],
  ];
  const insertMany = db.transaction((rows) => {
    for (const row of rows) seed.run(...row);
  });
  insertMany(seedData);
}

module.exports = db;
