const Database = require('better-sqlite3');
const db = new Database(':memory:');
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
try {
  db.prepare(`
    INSERT INTO tasks (day, hour, subject, priority, notes)
    VALUES (@day, @hour, @subject, @priority, @notes)
    ON CONFLICT(day, hour) DO UPDATE SET
      subject = excluded.subject,
      priority = excluded.priority,
      notes = excluded.notes
  `).run({
    day: 'Mon',
    hour: 7,
    subject: 'Test',
    priority: 'medium',
    notes: ''
  });
  console.log('SUCCESS');
} catch (e) {
  console.error('ERROR:', e.message);
}
