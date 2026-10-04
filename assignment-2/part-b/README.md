# Part B — DeepSeek Harness: creator mode and plugins

Installing [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
(DSH), customising a profile with seven plugins through **Creator mode**, and
two plugins written from scratch — one Host plugin that adds tools, one Client
plugin that adds UI.

Everything here was written against the DSH source at **v0.1.6-alpha.2**, not
from memory. The contracts used are cited to the files they come from, because
DSH is in developer preview and explicitly warns of breaking changes.

```
part-b/
├── plugins/
│   ├── dsh-second-brain/     PLUGIN 1 — Host: four tools, persistent memory
│   │   ├── package.json        the bundle manifest
│   │   ├── cordis.patch.yml    the row that inserts it into the profile
│   │   ├── index.js            apply(ctx) + tool registrations
│   │   └── store.js            append-only JSONL note store
│   └── dsh-brain-dock/       PLUGIN 2 — Client: a dock below the composer
│       ├── package.json        manifest with the dsh.client block
│       ├── cordis.patch.yml
│       ├── index.js            deliberately empty Host half
│       └── client.js           the browser artifact + React component
├── bundles/
│   └── dsh-creator-toolkit/  five MCP plugins in one configuration-only bundle
├── tests/
│   ├── test-second-brain.mjs   15 tests — drives every tool's execute()
│   ├── test-brain-dock.mjs     15 tests — drives the React component
│   └── validate-patches.py     manifest + patch validation
└── PROMPTS.md                the creator-mode prompts, with what each produced
```

---

## Verify before you install

Both plugins are tested offline, without booting DSH:

```bash
node tests/test-second-brain.mjs     # 15 passed
node tests/test-brain-dock.mjs       # 15 passed
python3 -m pip install pyyaml
python3 tests/validate-patches.py    # all manifests and patches valid
```

The tests build a stub `ctx`, call each plugin's `apply()`, and then invoke the
registered tools and the React component exactly as the runtime would. This is
not a substitute for installing the bundle — it is what makes it reasonable to
expect the install to work first time.

## Install DSH

```bash
npm install -g @deepseek-ai/dsh     # or: git clone && pnpm install && pnpm run build
dsh web                             # opens http://127.0.0.1:3080
```

Put a key in a gitignored `.env` at the repo root:

```
DEEPSEEK_API_KEY=sk-...
```

Then open the Web UI and select **Creator mode** from the preset dropdown.

---

## What Creator mode actually is

It is not a separate program. It is an **agent preset** — the same DSH agent
with three extra tools mounted:

| Tool | What it does |
|---|---|
| `cordis_inspect_list` | lists the runtime API providers (Host services, Client slots) |
| `cordis_inspect_query` | returns the exact method signatures and props of one provider |
| `plugin_manager` | installs, removes, enables and disables bundles in this profile |

That combination is what lets you author a plugin from inside a chat: the agent
discovers the real API rather than guessing at it, writes the package, and
installs it into the profile it is itself running in. With HMR enabled the
plugin appears in the *same* session.

Every `plugin_manager` action needs `danger-full-access` or per-call approval,
and installed Host code runs in-process **outside the workspace sandbox**. That
is the security trade of the whole design, and it is worth saying out loud in
the video.

> Sources in the DSH tree: `packages/extensions/tool-cordis/README.md`,
> `packages/boot/plugin-manager/README.md`,
> `packages/preset/agent-presets/presets/cordis/skills/cordis-plugin-development/SKILL.md`

---

## The seven plugins in this profile

| # | Plugin | Kind | How it arrives |
|---|---|---|---|
| 1 | **second-brain** | Host, 4 tools | `install_bundle` from `plugins/dsh-second-brain` — **written from scratch** |
| 2 | **brain-dock** | Client, UI slot | `install_bundle` from `plugins/dsh-brain-dock` — **written from scratch** |
| 3 | mcp-filesystem | MCP | `dsh-creator-toolkit` row 1 — structured file tools, scoped to roots |
| 4 | mcp-memory | MCP | row 2 — a knowledge graph the model maintains itself |
| 5 | mcp-sequential-thinking | MCP | row 3 — explicit decomposition with revision and branching |
| 6 | mcp-github | MCP | row 4 — issues and PRs as tools, token read from the environment |
| 7 | mcp-fetch | MCP | row 5 — URL retrieval converted for a model to read |
| + | agent-team | shipped bundle | already in the installation, switched off — enable, don't install |

Rows 3–7 install together:

```
Install the bundle at /absolute/path/to/part-b/bundles/dsh-creator-toolkit,
then list the plugins in this profile so I can see the five new rows.
```

A configuration-only bundle needs no code at all — just a `package.json`
declaring `dsh.bundle.patch` and a patch inserting
`@deepseek-ai/dsh-mcp-client` once per server. Each row stays independently
toggleable afterwards.

The shipped optional bundle is enabled rather than installed, because it is
already on disk:

```
Enable the @deepseek-ai/dsh-experimental-agent-team-profile bundle in this profile.
```

### Community plugins

The third-party ecosystem is real but moves fast and is largely unaudited —
installed Host code runs in-process, so treat an unknown bundle the way you
would `curl | sh`. Catalogs worth watching:
[vvlife/awesome-deepseek-harness-plugins](https://github.com/vvlife/awesome-deepseek-harness-plugins),
[LaplaceYoung/oh-my-dsh](https://github.com/LaplaceYoung/oh-my-dsh),
[0xsline/awesome-deepseek-harness](https://github.com/0xsline/awesome-deepseek-harness),
or the [`dsh-plugin` GitHub topic](https://github.com/topics/dsh-plugin).
Install one with `dsh plugin add <npm-package>`.

---

## Plugin 1 — second-brain (Host)

**The problem.** A session forgets everything when it ends. Anything the agent
should still know next week — a deploy runbook, a decision and why it was made,
your team's conventions — has to live outside the transcript.

**Four tools**, sharing one JSONL store across every session in the profile:

| Tool | Purpose |
|---|---|
| `brain_save` | store a durable note with tags |
| `brain_search` | keyword search, returns scores *and the terms that matched* |
| `brain_recent` | newest notes first, plus tag counts |
| `brain_forget` | delete by id |

### How it plugs in

A plugin is a module exporting `apply(ctx, config)`. `inject` names the
services it needs and Cordis guarantees they exist before `apply` runs:

```js
export const name = 'second-brain'
export const inject = ['tools']          // ctx.tools is ready inside apply()

export function apply(ctx, config = {}) {
  ctx.tools.register({ /* ... */ })
}
```

Registration is **effect-based**: unloading the plugin unregisters its tools.
There is no cleanup code in this plugin, and that is not an oversight.

### Zero dependencies, no build step

The tutorial shows `defineTool` from `@deepseek-ai/dsh-tools`. That is a
TypeScript ergonomics helper — it infers `args` types and validates input.
Reading `ToolRegistry.register()` in `packages/core/tools/src/index.ts:1043`
shows what is actually enforced at runtime:

```js
if (output === undefined || typeof output !== 'object'
  || typeof output.render !== 'function') throw new TypeError(...)
assertSupportedJsonSchema(output.schema)
```

Name, description, raw-JSON-Schema `parameters`, and an `output` block with a
`schema` and a `render`. So a plain-JavaScript plugin with **no dependencies
and no build tooling** is installable exactly as written — which matters,
because a bundle with a build step is a bundle that breaks on someone else's
machine. The cost is owning your own argument validation, which is why
`brain_save` checks for empty text itself.

### Three things the tool contract demands

**Errors are values, not exceptions.** `brain_forget` on a missing id returns
`{ removed: false }` — a successful call with a domain outcome. A throw means
infrastructure failed. Getting this backwards makes an agent treat "no such
note" as a crash worth retrying.

**`render` must be pure.** It runs on live streaming *and* on session replay,
so it cannot read the clock, the filesystem, or session state. It is a pure
function of `(args, value)`.

**Read-only tools opt into concurrency.** `brain_search` and `brain_recent`
declare `isConcurrencySafe: () => true` so they can run in a parallel group.
The mutating tools deliberately do not.

---

## Plugin 2 — brain-dock (Client)

A quick-capture box below the composer: type a note, press enter, it is in your
brain. `#hashtags` become tags. Cmd/Ctrl-Enter searches instead of saving.

### The browser artifact

A Client plugin registers a lazy factory under an id equal to the package name.
React comes from the browser module table — never a second copy, never a CDN
script:

```js
window.__ModuleLoader__.load({
  id: '@local/dsh-brain-dock',
  factory(require) {
    const React = require('react')
    return { inject: ['slots'], apply(ctx) { /* register into a slot */ } }
  },
})
```

### Choosing the slot

It registers into `conversation.composer.dock`, a **list** slot that already
allocates space below the composer — the shipped token-stats pills live in the
same slot. Two rules that bite:

- A **fresh `id`** is added beside the shipped entries. Reusing a shipped id
  puts you in *that* cell and **replaces** it.
- `shell.overlay` is for things that float over the whole app. Never register
  into the render-tree root: it is a single slot, and a dynamic entry outranks
  the shipped one, so the page would render your component *alone* with the
  entire app frame gone.

### Crossing to the Host without a wire protocol

The dock needs the Host's `brain_save`, but calling Host code from the browser
means declaring a Remote API — decorators, a code table, codegen, a build step
(`docs/cookbook/adding-a-remote-api.md`). Far too much for a dock.

So it does what a *user* does. It writes an instruction into the composer draft
and submits it:

```js
inputActions.setDraft(`Save this to my second brain using the brain_save tool.
Tag it: ${tags.join(', ')}.\n\nNote: ${text}`)
inputActions.submit()
```

The agent then calls the tool itself. No new protocol, and every capture is
visible in the transcript instead of happening invisibly. The two plugins stay
independent — either works without the other.

---

## Running the demo

```
1. Use brain_save to remember: staging deploys go through scripts/deploy.sh,
   never the CI button. Tag it deploy and staging.
2. (new session)  What do you remember about deploying to staging?
3. Type "rotate the API key quarterly #security" in the dock and press enter.
4. Press the dock's recall button with an empty box.
```

Step 2 is the one that matters: a **new session** with no transcript answers
correctly, which is the whole point of the plugin.

## Safety

`plugin_manager` needs `danger-full-access` or per-call approval, and installed
Host code runs **in-process, outside the workspace sandbox**. DSH has not been
security audited and says so. The two plugins here touch only their own JSONL
file and the composer draft — but an installed bundle *could* do anything, so
read a community plugin's source before installing it.
