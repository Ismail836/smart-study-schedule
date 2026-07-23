/* =========================================================
   Smart Study Schedule — Express server
   Serves the static site and exposes a small REST API that
   the builder page (public/js/schedule.js) calls instead of
   using localStorage, backed by db/schedule.db (SQLite).
   ========================================================= */

const path = require("path");
const express = require("express");
const db = require("./db/database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function isValidDay(day) {
  return DAYS.includes(day);
}
function isValidHour(hour) {
  const h = Number(hour);
  return Number.isInteger(h) && h >= 7 && h < 22;
}
function isValidPriority(priority) {
  return ["high", "medium", "low"].includes(priority);
}

// GET /api/tasks — all tasks, shaped as { "Mon-9": {subject, priority, notes}, ... }
// so the front-end can keep using the same "day-hour" key it used with localStorage.
app.get("/api/tasks", (req, res) => {
  const rows = db.prepare("SELECT day, hour, subject, priority, notes FROM tasks").all();
  const tasks = {};
  for (const row of rows) {
    tasks[`${row.day}-${row.hour}`] = {
      subject: row.subject,
      priority: row.priority,
      notes: row.notes || "",
    };
  }
  res.json(tasks);
});

// PUT /api/tasks/:day/:hour — create or update the block in one slot
app.put("/api/tasks/:day/:hour", (req, res) => {
  const { day, hour } = req.params;
  const { subject, priority, notes } = req.body;

  if (!isValidDay(day) || !isValidHour(hour)) {
    return res.status(400).json({ error: "Invalid day or hour." });
  }
  if (!subject || !subject.trim()) {
    return res.status(400).json({ error: "Subject is required." });
  }
  if (!isValidPriority(priority)) {
    return res.status(400).json({ error: "Priority must be high, medium, or low." });
  }

  db.prepare(
    `INSERT INTO tasks (day, hour, subject, priority, notes)
     VALUES (@day, @hour, @subject, @priority, @notes)
     ON CONFLICT(day, hour) DO UPDATE SET
       subject = excluded.subject,
       priority = excluded.priority,
       notes = excluded.notes`
  ).run({
    day,
    hour: Number(hour),
    subject: subject.trim(),
    priority,
    notes: (notes || "").trim(),
  });

  res.json({ ok: true });
});

// DELETE /api/tasks/:day/:hour — remove a single block
app.delete("/api/tasks/:day/:hour", (req, res) => {
  const { day, hour } = req.params;
  if (!isValidDay(day) || !isValidHour(hour)) {
    return res.status(400).json({ error: "Invalid day or hour." });
  }
  db.prepare("DELETE FROM tasks WHERE day = ? AND hour = ?").run(day, Number(hour));
  res.json({ ok: true });
});

// DELETE /api/tasks — clear the entire week
app.delete("/api/tasks", (req, res) => {
  db.prepare("DELETE FROM tasks").run();
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Smart Study Schedule running at http://localhost:${PORT}`);
});
