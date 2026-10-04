// @local/dsh-second-brain — a persistent memory for the agent.
//
// WHY THIS PLUGIN EXISTS
// A Harness session forgets everything when it ends. Anything you want the
// agent to still know next week — a deploy runbook, a decision and its reason,
// your team's conventions — has to live outside the transcript. This plugin
// gives the agent four tools to write to and read from a durable note store
// that is shared by every session in the profile.
//
// HOW IT PLUGS IN
// A Harness plugin is a module exporting `apply(ctx, config)`. `inject` names
// the services it needs, and Cordis guarantees they exist before `apply` runs.
// Registration is effect-based: when the plugin unloads, its tools unregister
// themselves. Nothing here has to be cleaned up by hand.
//
// NO BUILD STEP, NO DEPENDENCIES
// `ctx.tools.register()` accepts a plain definition object whose `parameters`
// and `output.schema` are raw JSON Schema. `defineTool` from
// @deepseek-ai/dsh-tools is a TypeScript ergonomics helper, not a requirement,
// so this plugin is installable JavaScript exactly as written.

import { homedir } from 'node:os'
import { join } from 'node:path'
import { BrainStore } from './store.js'

export const name = 'second-brain'

// Cordis waits for the tool registry before calling apply().
export const inject = ['tools']

const DEFAULT_PATH = join(homedir(), '.dsh', 'second-brain.jsonl')

/** A note as every tool returns it. Declared once, reused by each schema. */
const NOTE_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string', description: 'Stable short id, used by brain_forget.' },
    text: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    savedAt: { type: 'string', description: 'ISO-8601 timestamp.' },
    source: { type: 'string', description: 'Where the note came from.' },
  },
  required: ['id', 'text', 'tags', 'savedAt'],
}

/** Compact one-line rendering of a note for model-facing content. */
function line(note) {
  const tags = note.tags.length ? ` [${note.tags.join(', ')}]` : ''
  const when = note.savedAt.slice(0, 10)
  return `(${note.id})${tags} ${when} — ${note.text}`
}

/**
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * @param {{ path?: string, maxNoteLength?: number }} [config]
 */
export function apply(ctx, config = {}) {
  const store = new BrainStore(config.path ?? DEFAULT_PATH)
  const maxNoteLength = config.maxNoteLength ?? 4000

  // ---------------------------------------------------------------- save

  ctx.tools.register({
    name: 'brain_save',
    description: [
      'Save a durable note to the user\'s second brain. Use this whenever you',
      'learn something worth remembering beyond this session: a preference, a',
      'decision and its reasoning, a command that worked, a project convention.',
      'Write the note so it is useful to a reader who has no memory of this',
      'conversation — include the subject, not just the conclusion.',
    ].join(' '),
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The note. Self-contained prose, not a fragment.',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lowercase topic tags for later retrieval, e.g. ["deploy","postgres"].',
        },
        source: {
          type: 'string',
          description: 'Optional origin, e.g. a file path or URL.',
        },
      },
      required: ['text'],
    },
    output: {
      schema: {
        type: 'object',
        properties: { saved: NOTE_SCHEMA, totalNotes: { type: 'number' } },
        required: ['saved', 'totalNotes'],
      },
      render: (_args, value) =>
        [{ type: 'text', text: `Saved note ${value.saved.id}. The brain now holds ${value.totalNotes} note(s).` }],
    },
    async execute(args) {
      // The schema cannot express "non-empty", so check it here. Returning a
      // clear error beats storing an empty note.
      const text = String(args.text ?? '').trim()
      if (!text) throw new Error('brain_save requires non-empty text.')
      if (text.length > maxNoteLength) {
        throw new Error(`Note is ${text.length} characters; the limit is ${maxNoteLength}. Save a summary instead.`)
      }

      const saved = store.save({
        text,
        tags: Array.isArray(args.tags) ? args.tags : [],
        source: args.source ?? null,
      })
      return { saved, totalNotes: store.notes.size }
    },
  })

  // -------------------------------------------------------------- search

  ctx.tools.register({
    name: 'brain_search',
    description: [
      'Search the second brain for notes matching a query. Call this BEFORE',
      'answering questions about the user\'s past decisions, preferences or',
      'conventions, and before asking them something they may have told you',
      'already. Returns scored matches with the terms that matched.',
    ].join(' '),
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Keywords or a phrase to look for.' },
        tag: { type: 'string', description: 'Restrict results to this tag.' },
        limit: { type: 'number', description: 'Maximum notes to return (default 5).' },
      },
      required: ['query'],
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          total: { type: 'number' },
          matches: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                text: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                savedAt: { type: 'string' },
                source: { type: 'string' },
                score: { type: 'number' },
                matchedTerms: { type: 'array', items: { type: 'string' } },
              },
              required: ['id', 'text', 'tags', 'savedAt', 'score'],
            },
          },
        },
        required: ['total', 'matches'],
      },
      render: (args, value) => {
        if (value.matches.length === 0) {
          return [{ type: 'text', text: `No notes match "${args.query}". The brain may simply not know this yet.` }]
        }
        const body = value.matches
          .map((m) => `${line(m)}  (score ${m.score}; matched ${m.matchedTerms.join(', ') || 'tag'})`)
          .join('\n')
        const more = value.total > value.matches.length
          ? `\n(${value.total - value.matches.length} further match(es) not shown)`
          : ''
        return [{ type: 'text', text: `${value.total} match(es):\n${body}${more}` }]
      },
    },
    // Pure read: safe to run alongside other tool calls.
    isConcurrencySafe: () => true,
    async execute(args) {
      return store.search({
        query: String(args.query ?? ''),
        tag: args.tag ?? null,
        limit: Math.min(Math.max(Number(args.limit) || 5, 1), 50),
      })
    },
  })

  // -------------------------------------------------------------- recent

  ctx.tools.register({
    name: 'brain_recent',
    description:
      'List the most recently saved notes, newest first. Use this to orient '
      + 'yourself at the start of a session, or when the user asks what you remember.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'How many notes to return (default 10).' },
        tag: { type: 'string', description: 'Restrict to one tag.' },
      },
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          notes: { type: 'array', items: NOTE_SCHEMA },
          totalNotes: { type: 'number' },
          tags: {
            type: 'array',
            items: {
              type: 'object',
              properties: { tag: { type: 'string' }, count: { type: 'number' } },
              required: ['tag', 'count'],
            },
          },
        },
        required: ['notes', 'totalNotes', 'tags'],
      },
      render: (_args, value) => {
        if (value.notes.length === 0) {
          return [{ type: 'text', text: 'The second brain is empty. Use brain_save to add the first note.' }]
        }
        const tagLine = value.tags.length
          ? `\ntags in use: ${value.tags.map((t) => `${t.tag}(${t.count})`).join(', ')}`
          : ''
        return [{
          type: 'text',
          text: `${value.notes.length} of ${value.totalNotes} note(s):\n`
            + value.notes.map(line).join('\n') + tagLine,
        }]
      },
    },
    isConcurrencySafe: () => true,
    async execute(args) {
      const notes = store.recent({
        limit: Math.min(Math.max(Number(args.limit) || 10, 1), 100),
        tag: args.tag ?? null,
      })
      return { notes, totalNotes: store.notes.size, tags: store.tags() }
    },
  })

  // -------------------------------------------------------------- forget

  ctx.tools.register({
    name: 'brain_forget',
    description:
      'Delete one note by id. Ids come from brain_search or brain_recent. '
      + 'Confirm with the user before deleting anything they did not explicitly ask to remove.',
    parameters: {
      type: 'object',
      properties: { id: { type: 'string', description: 'The note id to delete.' } },
      required: ['id'],
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          removed: { type: 'boolean' },
          id: { type: 'string' },
          remaining: { type: 'number' },
        },
        required: ['removed', 'id', 'remaining'],
      },
      // A miss is a successful call with removed:false, not an error — the
      // domain outcome belongs in the canonical value.
      render: (_args, value) => [{
        type: 'text',
        text: value.removed
          ? `Deleted note ${value.id}. ${value.remaining} note(s) remain.`
          : `No note with id ${value.id}. Nothing was deleted.`,
      }],
    },
    async execute(args) {
      const id = String(args.id ?? '').trim()
      const removed = id ? store.forget(id) : false
      return { removed, id, remaining: store.notes.size }
    },
  })

  ctx.logger?.info?.(`[second-brain] ready — store at ${store.path}`)
}
