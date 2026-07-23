# Smart Study Schedule Project Audit

## Short answer

This repository does have a backend and a database layer.
Older copy in some HTML pages still described the project as static and using localStorage, but that is no longer accurate.
The actual working code path is:

`public/schedule.html` -> `public/js/schedule.js` -> `/api/tasks` -> `server.js` -> `db/database.js` -> SQLite file `db/schedule.db`

So the `database.js` file is not dead code. It is imported by `server.js` and is part of the live application.

## What the project contains

- `server.js`: Express server that serves the static pages and exposes the REST API.
- `db/database.js`: SQLite setup, schema creation, and seed data.
- `public/index.html`: Home page and project intro.
- `public/schedule.html`: Interactive weekly builder.
- `public/tips.html`: Study advice and FAQ page.
- `public/about.html`: Project background page.
- `public/contact.html`: Contact/demo form page.
- `public/css/style.css`: Shared design system and builder styling.
- `public/js/main.js`: Shared page behavior such as footer year and Bootstrap tooltips.
- `public/js/schedule.js`: Builder logic that loads/saves schedule data through the API.

## How the database works

- SQLite is created in `db/schedule.db` when the server starts.
- The `tasks` table stores one row per day/hour slot.
- The `(day, hour)` pair is unique, so a slot can only contain one study block.
- The database is seeded with a few example entries if it is empty on first run.

## How the builder works

- `schedule.js` builds the weekly grid in the browser.
- It fetches all tasks from `GET /api/tasks` when the page loads.
- It saves a block with `PUT /api/tasks/:day/:hour`.
- It deletes a single block with `DELETE /api/tasks/:day/:hour`.
- It clears the week with `DELETE /api/tasks`.

## Why some pages still say "no backend"

Several pages were written for the earlier static version of the project and were not fully updated after the backend was added.
That is why you still see statements like:

- "no backend, no database"
- "saved in localStorage"
- "not wired to a server"

Those statements are now outdated for the builder path.
They are documentation text, not the current runtime behavior.

## What is actually working now

- The schedule builder is backed by Express and SQLite.
- The data persists on the server, not only in one browser.
- The app can be used from more than one device as long as both reach the same server.

## Important note

If you open the HTML files directly without running `server.js`, the database-backed builder will not work.
You must start the Node server with `npm start` so the `/api/tasks` endpoints are available.

## Recommended cleanup

- Update the outdated copy in `public/about.html` and `public/contact.html` so the text matches the live backend.
- Update the home page and any assignment notes so they describe the current SQLite version instead of the older localStorage version.
- Keep this audit file in the repo as the source of truth for the current architecture.