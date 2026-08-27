# Habit Tracker

## What it does
A single-page grid for tracking up to 10 habits across every day of the current
month, weekends included. Click a square to mark a day done, click again to undo.
Habits can be renamed inline and removed; today's column is highlighted and
scrolled into view on load.

## Stack
- Plain HTML, CSS, JavaScript (no framework)
- Data stored in `localStorage` under the single key `habitTracker.v1`
- No build step — open `index.html` directly in a browser

## Running the app
Open `index.html` in Chrome. 

## Conventions
- One file per concern: `index.html`, `style.css`, `app.js`
- Add a comment above each function explaining what it does
- Always confirm with me before adding a new feature or page that wasn't in the original request
- If anything is unclear, ask me a question before making assumptions.

## Do not
- Add any npm dependencies
- Commit any secrets — no API keys, passwords, or tokens in the files