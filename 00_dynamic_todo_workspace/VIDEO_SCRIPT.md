# Video Walkthrough Script — Zenith Task Workspace

**Runtime target: ~2.5 minutes**

---

Hey everyone, welcome back. Today I'm walking you through Zenith Task — a fullstack dynamic todo workspace that I got an AI coding assistant to build completely from scratch, front to back, in one sitting.

The original prompt I gave it was almost stupidly simple. I just said: "in a directory fullstack-test - build a modern end2end dynamic todo list application industry best experience of ux and nice features - make reasonable assumptions." That's it. No spec, no wireframes. I told it to make reasonable assumptions and just ran with whatever it decided a "best in class" todo app should look like. I did follow up a couple times afterward — I asked it to write a design doc to explain its choices, and I had it test the frontend with the Chrome DevTools extension to sanity-check itself.

So let's look at what it actually built. This is a React and Vite frontend talking to an Express backend over a real SQLite database, with Server-Sent Events for live updates — so if you had two browser tabs open, changes in one would push to the other instantly.

Let me show you the quick-add bar at the top. This is the fun part — it's got a natural language parser built in. Watch what happens when I type something like "Ship walkthrough video, high priority, hashtag launch, twenty minutes." I can just type the shorthand — bang-high for priority, hash-launch for a tag, tilde-20-m for a time estimate — and it parses all of that live as I type, showing me little recognized token pills, then creates a fully-structured task when I hit Add.

Now let's flip through the views. There's a List view with smart date-bucketing — overdue, today, upcoming. There's a Kanban board with drag and drop across four stages. There's an Eisenhower decision matrix for urgency versus importance. A calendar timeline you can click to schedule against. And a Pomodoro focus timer with actual synthesized audio chimes when a session ends — no external sound files, it's generating the tones with the Web Audio API oscillator.

One architecture detail worth calling out: the natural language parsing happens entirely client-side and sends clean structured fields to the API — title, priority, due date, tags — rather than shipping raw text to the server to interpret. That's a nice separation of concerns, and it's also exactly where I found a real bug while auditing this project: the backend was treating incoming tag values as if they were already database IDs, so typing any brand-new hashtag in the quick-add bar — anything that wasn't one of the five seeded tags — would throw a foreign key constraint error and silently kill the whole task creation request. I fixed it by adding a proper find-or-create resolver on the server so new tags typed on the fly get created and linked correctly, which is actually the whole point of a natural language tagging feature.

For my creative addition, I added an Overdue Tasks metric card to the Analytics dashboard. The backend was already computing that number, it just wasn't surfaced anywhere in the UI — and for a productivity app, knowing at a glance how many things are actively slipping past their due date felt like the most useful missing signal, right up there next to completion velocity and streaks.

That's Zenith Task — a genuinely full-featured, glassmorphic todo app that an AI assistant built from a single loose sentence of a prompt. If you want to see how the other projects in this series turned out, stick around, there's a lot more coming.
