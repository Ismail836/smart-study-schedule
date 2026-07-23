# Smart Study Schedule

A multi-page site with an interactive weekly study-schedule builder.
This version stores the schedule in a real **SQLite database** through
a **Node.js + Express** backend, instead of the browser's `localStorage`.

## Project structure

```
smart-study-schedule/
├── server.js            Express app: serves the site + REST API
├── db/
│   └── database.js      SQLite schema + seed data (better-sqlite3)
├── public/               Front-end site (served by Express)
│   ├── index.html, schedule.html, tips.html, about.html, contact.html
│   ├── css/style.css
│   └── js/main.js, js/schedule.js   (schedule.js now calls the API)
└── package.json
```

## How the database works

- Every hour-block a student plans is one row in the `tasks` table:
  `id, day, hour, subject, priority, notes`, with a `UNIQUE(day, hour)`
  constraint so a slot can only hold one task at a time.
- The database file `db/schedule.db` is created automatically the
  first time you run the server, seeded with a few example blocks.

## API endpoints

| Method | Route                    | Purpose                        |
|--------|--------------------------|---------------------------------|
| GET    | `/api/tasks`             | Get the whole week's plan       |
| PUT    | `/api/tasks/:day/:hour`  | Create or update one block      |
| DELETE | `/api/tasks/:day/:hour`  | Remove one block                |
| DELETE | `/api/tasks`             | Clear the entire week           |

## Running it

```bash
npm install
npm start
```

Then open **http://localhost:3000** in your browser. The schedule
builder page is at `/schedule.html` — changes you make there are now
saved to the database (`db/schedule.db`) instead of the browser.

## Notes for the assignment write-up

- Previously: `schedule.js` read/wrote a JSON blob to
  `localStorage` under the key `sss_schedule_v1`.
- Now: `schedule.js` calls `fetch()` against the `/api/tasks`
  endpoints; `server.js` handles those requests and reads/writes
  `db/schedule.db` using `better-sqlite3`.
- This means the schedule now persists on the server rather than
  in a single browser, and would be visible from any device hitting
  the same server.

## Keeping the copy in sync

- Some older assignment text referred to the project as static-only.
- The live builder now uses Express + SQLite, so any write-up should
  describe the backend as part of the finished submission.
