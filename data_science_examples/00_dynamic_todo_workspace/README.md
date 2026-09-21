# Zenith Task

*Answers to the questions you'd probably ask about this project, in the order you'd probably ask them.*

## What is this?

A todo app — but built for someone who lives inside their task list all day. Zenith Task pairs a natural-language quick-add bar with five different ways to look at the same underlying work: a bucketed list, a Kanban board, an Eisenhower matrix, a calendar, and an analytics dashboard with a Pomodoro timer bolted on for good measure.

It started from a single loose instruction to an AI coding assistant — *"build a modern end2end dynamic todo list application, industry best experience of ux and nice features, make reasonable assumptions"* — with two follow-ups asking for a written design doc and a Chrome DevTools pass on the frontend. No spec, no wireframe. Everything below is what came out the other side.

## How do I type a task instead of filling out a form?

Type it. The quick-add bar has a small parser built in, so a line like `Ship walkthrough video !high #launch ~20m` is read live, keystroke by keystroke, and broken into a title, a priority chip, a tag, and a time estimate before you hit Enter — with pills appearing above the input so you can see exactly what got recognized. The parsing happens entirely client-side; the server only ever receives clean structured fields, never raw text to interpret.

## What does the list actually look like day to day?

Date-bucketed — Overdue, Today, Upcoming — with priority chips, tag pills, and subtask progress bars on each card.

![Zenith List View](./screenshots/todo_list_view.png)

## I prefer moving cards around. Is there a board?

A four-column Kanban board — To Do, In Progress, In Review, Done — with drag-and-drop between stages and live per-column counts.

![Zenith Kanban Board](./screenshots/todo_kanban_board.png)

## What if I can't tell what's actually urgent versus just loud?

That's what the Eisenhower matrix is for: a four-quadrant urgency-vs-importance grid (Do First, Schedule, Delegate, Eliminate) where dragging a card into a new quadrant re-assigns it.

![Zenith Eisenhower Matrix](./screenshots/todo_eisenhower_matrix.png)

## Can I see things laid out by date instead of by status?

Yes — a monthly calendar timeline where scheduled tasks appear as markers on their due date, and clicking any day opens a quick-schedule modal.

![Zenith Calendar Timeline](./screenshots/todo_calendar_timeline.png)

## Does it tell me how I'm actually doing, or just hold my tasks?

Both. The analytics dashboard tracks weekly completion velocity, a current streak counter, and a GitHub-style 30-day activity heatmap so momentum (or its absence) is visible at a glance.

![Zenith Analytics Dashboard](./screenshots/todo_analytics_dashboard.png)

## And the Pomodoro thing?

A built-in focus timer — 25 minutes on, 5 off — that tracks time-spent per task and chimes when a session ends using tones synthesized live through the Web Audio oscillator API, not a sound file.

![Zenith Pomodoro Focus](./screenshots/todo_pomodoro_focus.png)

## What's it built with?

- **Frontend**: React 18 + Vite, Lucide icons, a hand-rolled glassmorphic CSS design system (no component library).
- **Backend**: Express.js REST API, broadcasting live changes over Server-Sent Events so two open tabs stay in sync without polling.
- **Storage**: SQLite.
- **Audio**: Web Audio API oscillator synthesis for the Pomodoro chime.

## Are there any packaged agent skills in here?

Yes, under `skills/` and `.agents/skills/`:

- `matt-pocock-typescript-patterns` — discriminated unions and strict runtime safety patterns.
- `dashboard-specification` — layout specs for the analytics telemetry views.
- `visualization-builder` — heatmap and velocity chart construction.

## How do I run it myself?

```bash
# Backend — Express + SQLite, port 5000
cd server
npm install
npm run dev

# Frontend — React + Vite, port 5173
cd client
npm install
npm run dev   # open http://localhost:5173/
```

## Anything worth reading beyond the code?

`VIDEO_SCRIPT.md` walks through the build narrative on camera, including a real bug that was found and fixed during the audit pass: the backend treated incoming tags as if they were already database IDs, so typing a brand-new hashtag in the quick-add bar threw a foreign-key error and silently killed task creation. A find-or-create resolver fixed it. `screenshots/verified_walkthrough.png` is a from-this-session capture confirming the fix and the rest of the UI render correctly end to end.
