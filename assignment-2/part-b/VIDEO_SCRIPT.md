# Part B — YouTube walkthrough script

Target **20–25 minutes**. Two halves: a full code walkthrough of both plugins
(the assignment asks for every file), then live demos in the DSH Web UI.

**Before recording**

```bash
node tests/test-second-brain.mjs && node tests/test-brain-dock.mjs
python3 tests/validate-patches.py
rm -f ~/.dsh/second-brain.jsonl         # start with an empty brain on camera
dsh web                                  # http://127.0.0.1:3080, Creator mode selected
```

Have two browser tabs ready: the Web UI, and `deepseek-ai/deepseek-harness` on
GitHub for the citations. Keep a terminal visible for the file walkthrough.

---

## 0 · Cold open (0:00–1:30)

Open the Web UI with the brain-dock already installed. Type into the dock:

```
staging deploys go through scripts/deploy.sh, never the CI button #deploy
```

Enter. The composer fills, submits, the agent calls `brain_save`.

**Then open a brand-new session** and ask: *"What do you remember about
deploying to staging?"* — it answers correctly.

> "A new session, no transcript, and it still knows. That's a plugin I wrote,
> and by the end of this video you'll have seen every line of it."

---

## 1 · What DSH and Creator mode actually are (1:30–4:00)

Show the repo README: *"Everything is a Plugin"*, built on Cordis.

> "The agent loop, the tools, the UI — all plugins. Which means extending it
> doesn't mean forking it."

Now run **prompt 0** from `PROMPTS.md`: ask the agent to list its tools and say
which are Creator-mode specific.

> "Creator mode isn't a separate program. It's the same agent with three extra
> tools: two that read the live runtime API, and one that installs plugins into
> the profile it's running in."

Run **prompt 1** — `cordis_inspect_list`, then `cordis_inspect_query` on the
Client slots provider. Let the output for `conversation.composer.dock` render
and point at `inputActions` in the standard props.

> "That's the contract I'm about to use. The agent read it out of the running
> process — this is why you don't guess at DSH's API."

---

## 2 · Plugin 1 walkthrough — second-brain (4:00–10:00)

Go file by file in the terminal/editor.

**`package.json`** — the bundle manifest.
- `dsh.bundle.patch` is the one field that makes it installable.
- No `dependencies`. Say that out loud; come back to it in a moment.

**`cordis.patch.yml`** — the row.
- `id` is the handle `plugin_manager` and the Plugins page address it by.
- `name` matches the package name.
- `config` is handed straight to `apply(ctx, config)`.

**`index.js`** — the plugin itself. Spend most of the time here.

```js
export const inject = ['tools']
export function apply(ctx, config = {}) { ctx.tools.register({...}) }
```

Three points, in order:

1. **`inject` is a guarantee.** Cordis waits for `ctx.tools` before calling
   `apply`. No defensive checks needed.
2. **Registration is effect-based.** Unloading the plugin unregisters the
   tools. Show that there is no cleanup code, and that this is deliberate.
3. **Why there's no `defineTool`.** Open
   `packages/core/tools/src/index.ts` around line 1043 in the GitHub tab and
   read what `register()` actually enforces: an `output` object with a `schema`
   and a `render` function, and a supported JSON Schema.
   > "`defineTool` is a TypeScript helper, not a requirement. Registering raw
   > means zero dependencies and no build step — which matters, because a
   > bundle with a build step is a bundle that breaks on someone else's
   > machine. The cost is validating my own arguments, which is why
   > `brain_save` checks for empty text itself."

Then the three contract rules, pointing at each in the code:
- **`brain_forget` on a missing id returns `{removed: false}`** — a successful
  call with a domain outcome, not a throw. Throws mean infrastructure failed.
- **`render` is pure** — it runs on live streaming *and* session replay, so no
  clock, no filesystem, no session state.
- **`isConcurrencySafe` on the two read-only tools only.**

**`store.js`** — append-only JSONL.
- Deletion via tombstone lines; later lines win.
- A corrupt line is skipped, not thrown on: "losing one note beats a plugin
  that won't load."
- `compact()` is the garbage collector.

---

## 3 · Plugin 2 walkthrough — brain-dock (10:00–14:30)

**`package.json`** — the `dsh.client` block is what makes it a Client plugin:
`platform: web`, `immediately: true`, and `./client` in `exports`.

**`index.js`** — empty on purpose. Explain that a Host plugin exports *either*
a default service class *or* named `apply`/`inject`, never a mix.

**`client.js`** — the real content.

- `window.__ModuleLoader__.load({ id, factory })`, where `id` **equals the
  package name**.
- `require('react')` comes from the browser module table.
  > "No second React, no CDN script. That's a rule, not a preference."
- Slot choice — the part worth dwelling on:
  > "`conversation.composer.dock` is a list slot that already has space; the
  > shipped token-stats pills live in it. A fresh id sits *beside* them.
  > Reuse a shipped id and you *replace* that entry. And never register into
  > the render-tree root — it's a single slot, a dynamic entry outranks the
  > shipped one, and the page would render my component alone with the whole
  > app frame gone."
- `ctx.effect(() => ctx.slots.inject(...))` — disposal removes the dock.
- **The Host bridge decision.** Show `inputActions.setDraft()` + `submit()`,
  then open `docs/cookbook/adding-a-remote-api.md` and scroll the decorators
  and error-code table.
  > "That's what calling the Host properly costs: decorators, a code table,
  > codegen, a build step. Right for a product, wrong for a dock. So the dock
  > does what a user does — writes the draft and submits it. Every capture
  > shows up in the transcript instead of happening invisibly."

---

## 4 · Tests (14:30–16:30)

```bash
node tests/test-second-brain.mjs
node tests/test-brain-dock.mjs
python3 tests/validate-patches.py
```

Explain what the tests actually do — this is unusual enough to be worth it:

> "These build a stub `ctx`, call the plugin's `apply()`, and then invoke every
> tool's `execute()` exactly like the registry would. The dock test stubs
> `window.__ModuleLoader__` and React and drives the component — typing,
> clicking save, checking what reaches `inputActions`. Thirty tests, no DSH
> running. It doesn't prove how the dock *looks* — only the running UI does
> that — but it's why the install worked first time."

Call out `every definition satisfies the registry contract` and
`notes survive a reload, which is the whole point`.

---

## 5 · Live demos (16:30–22:00)

Work through `PROMPTS.md` in order. Prompts 2 → 3 → 4 → 5 → 7 → 8.

**Prompt 2/3 — install and demo second-brain.** After install, ask for the
tool list again:
> "Installed and *available* are different claims. Verify the second one."

Then save a note, **open a new session**, and ask what it remembers. Pause on
this — it is the strongest moment in the video. Then show `brain_forget` with a
junk id returning "Nothing was deleted" as a success.

**Prompt 4/5 — install and demo brain-dock.** Show the dock appearing via HMR.
Type with `#hashtags`, press enter, watch the composer fill and submit. Press
recall on an empty box.

**Prompt 7 — five MCP plugins in one install.** Open the patch first:
> "No code in this bundle at all. A manifest and a patch. Five rows, same MCP
> client package, five different configs."

Then list `mcp__` tools. **If some servers failed to start, leave it in** —
every row sets `failOnStartupError: false`, and explaining why is better
content than a curated success.

**Prompt 8** — enable the shipped `agent-team` bundle. Draw the distinction:
installing adds a dependency, enabling selects one that already ships.

---

## 6 · Author a plugin live, then close (22:00–25:00)

Run **prompt 6**: the session clock, from one sentence. Narrate the loop —
inspect the live API, write the files, install, verify.

> "If it breaks, watch what it does: reads the failure, fixes its own patch,
> reinstalls. That loop *is* Creator mode."

Close on safety (prompt 9):

> "`plugin_manager` needs `danger-full-access` or per-call approval, and
> installed Host code runs in-process, outside the workspace sandbox. DSH
> hasn't been security audited — it says so in its own README. My two plugins
> touch one JSONL file and the composer draft, but a bundle *could* do
> anything. Treat an unknown community plugin like `curl | sh`."

---

## Recording checklist

- [ ] `rm -f ~/.dsh/second-brain.jsonl` before rolling — an empty brain on camera
- [ ] `.env` never on screen
- [ ] Every file in `plugins/` opened at least once (the assignment asks for a
      full walkthrough)
- [ ] The **new-session recall** demo recorded — it is the proof the plugin works
- [ ] At least one failure shown honestly (a missing MCP server, or a disabled
      plugin losing its tools)
- [ ] The GitHub tab used at least twice to cite a contract in DSH's own source
- [ ] DSH version stated on camera (`0.1.6-alpha.2`) — it breaks between alphas
