# Creator-mode prompts

The assignment asks to "showcase the prompt and demo of the plugin". These are
the prompts to run on camera, what each one should produce, and how to tell it
actually worked rather than merely claimed to.

A note on honesty for the video: the two plugins in `plugins/` are authored as
files in this repo, and Creator mode *installs* them. You can also have Creator
mode author one from scratch live — prompt 6 does exactly that — but a live
authoring run is slow and can fail on camera, so the reliable recording is
"install the written plugin, then show the agent authoring a small one live".

---

## 0 · Before anything — prove which tools Creator mode adds

> List every tool you have available right now. Which of them are specific to
> Creator mode, and what is each one for?

**Expect:** `cordis_inspect_list`, `cordis_inspect_query`, `plugin_manager`
alongside the usual file and shell tools.

**Why start here:** it shows Creator mode is not a separate program — it is the
same agent with three extra tools mounted.

---

## 1 · Discover the real API instead of guessing

> Use `cordis_inspect_list` to show me the runtime API providers. Then use
> `cordis_inspect_query` on the Client `Slots` provider and tell me what
> `conversation.composer.dock` expects: its registration options and the props
> it passes to a component.

**Expect:** the slot's `id` / `order` / `label` options, and standard props
including `inputActions`, `useChat`, `useSession`, `sessionId`.

**Why it matters:** this is the step that separates plugin authoring in DSH
from plugin authoring anywhere else. The agent reads the live contract out of
the running process. Point at `inputActions` on screen — that is the exact API
the dock uses in `client.js`.

---

## 2 · Install plugin 1 (Host, four tools)

> Install the bundle at `<absolute path>/part-b/plugins/dsh-second-brain`.
> After it applies, list the plugins in this profile and confirm the
> second-brain row is active.

**Expect:** `application: applied`, then a `second-brain` row.

**Verify, don't trust:** ask for the tool list again and confirm `brain_save`,
`brain_search`, `brain_recent`, `brain_forget` are now present. Installation
and tool availability are different claims.

---

## 3 · Demo plugin 1 — the part that proves it works

> Use brain_save to remember: staging deploys go through `scripts/deploy.sh`,
> never the CI button. Tag it `deploy` and `staging`.

then — **start a brand new session** —

> What do you remember about deploying to staging?

**Expect:** the new session calls `brain_search` and answers correctly with no
transcript to draw on.

**Why this is the money shot:** anything can look like it works inside one
conversation. A second session answering from a file on disk is the only
demonstration that the memory is real.

Then show a deletion and that a miss is not an error:

> Show me what you remember with brain_recent, then forget the staging note.
> Then try to forget the id `deadbeef`.

**Expect:** `deadbeef` returns "Nothing was deleted" as a *successful* call.

---

## 4 · Install plugin 2 (Client, UI)

> Install the bundle at `<absolute path>/part-b/plugins/dsh-brain-dock`, then
> tell me whether its Client registration is live in this page.

**Expect:** `application: applied`, and a "🧠 brain" row appears below the
composer — HMR loads it into the running session.

**If it does not appear:** say so on camera rather than cutting. Replacing an
already-installed package needs a restart to load a fresh module generation;
a first install activates through HMR. `dsh web` again, then show it.

---

## 5 · Demo plugin 2

Type into the dock (do not type in the composer):

```
rotate the API key quarterly #security #ops
```

Press enter. **Expect:** the composer fills with a `brain_save` instruction,
submits itself, and the agent saves the note with tags `security` and `ops`.

Then press **recall** with the box empty. **Expect:** a `brain_recent` call.

**The teaching point:** the dock never calls the Host directly. It writes the
draft and submits, so every capture is visible in the transcript. Crossing to
the Host properly would mean a Remote API — decorators, a code table, codegen,
a build step — which is the right call for a product and the wrong call for a
dock.

---

## 6 · Author a plugin live, from one sentence

The demo the DSH write-ups are known for. Run it *after* the reliable demos are
recorded, so a failure costs nothing:

> Add a small clock to the bottom of the composer showing the elapsed time of
> the current session. Inspect the Client slots first, write it as a plugin in
> `/tmp/session-clock`, install it with plugin_manager, and tell me how to
> verify it.

**Expect:** `cordis_inspect_query` on the slots provider → a `package.json`,
`cordis.patch.yml` and `client.js` written to disk → `install_bundle` → the
clock appears.

**Narrate the loop:** inspect the live API, write, install, verify, repair.
That loop is Creator mode. If it fails, showing the agent *reading the failure
and fixing its own patch* is a better demonstration than a clean run.

---

## 7 · Install the five MCP plugins in one call

> Install the bundle at `<absolute path>/part-b/bundles/dsh-creator-toolkit`,
> then list this profile's plugins.

**Expect:** five new rows — `mcp-filesystem`, `mcp-memory`,
`mcp-sequential-thinking`, `mcp-github`, `mcp-fetch`.

**Point out:** the bundle contains **no code** — a `package.json` and a patch.
Each row inserts the same `@deepseek-ai/dsh-mcp-client` with a different
config. Every row is independently toggleable afterwards.

Then show that tools actually arrived:

> List your tools that start with `mcp__`.

Some servers will fail to start without their credentials or `uvx`. That is
why every row sets `failOnStartupError: false`, and a partially working set is
a more honest demo than a curated one.

---

## 8 · Enable the shipped optional bundle

> Enable the `@deepseek-ai/dsh-experimental-agent-team-profile` bundle.

**Expect:** enabled without an install — it already ships with DSH, switched
off for the user to turn on.

**The distinction worth stating:** *installing* adds a dependency; *enabling*
selects a bundle that is already there.

---

## 9 · Show the rails, then turn one off

> Disable the second-brain plugin, then try to save a note.

**Expect:** the `brain_*` tools are gone; the agent reports it cannot.

Re-enable it and close on the safety point:

> What permissions does plugin_manager require, and where does installed plugin
> code run relative to the workspace sandbox?

**Expect:** `danger-full-access` or per-call approval; installed Host code runs
**in-process, outside the workspace sandbox**. Say plainly that DSH has not
been security audited — it says so itself — and that an unknown community
bundle deserves the same scrutiny as `curl | sh`.
