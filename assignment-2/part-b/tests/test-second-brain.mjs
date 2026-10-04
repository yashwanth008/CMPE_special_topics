// Offline verification for @local/dsh-second-brain.
//
// The plugin cannot be unit-tested inside a running Harness without booting the
// whole application, so this script does what the Harness does: it builds a
// stub `ctx` exposing `tools.register`, calls the plugin's `apply()`, and then
// invokes each registered tool's `execute()` exactly as the tool registry
// would — including validating that every definition satisfies the contract
// `ToolRegistry.register()` enforces (name, description, parameters, and an
// output block with a schema and a render function).
//
//   node tests/test-second-brain.mjs
//
// This is not a substitute for installing the bundle; it is what makes it
// reasonable to install one that works the first time.

import { mkdtempSync, rmSync, existsSync, readFileSync, appendFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'

import { apply, name, inject } from '../plugins/dsh-second-brain/index.js'
import { BrainStore } from '../plugins/dsh-second-brain/store.js'

let passed = 0
let failed = 0

function test(label, fn) {
  try {
    fn()
    passed++
    console.log(`  \x1b[32m✓\x1b[0m ${label}`)
  } catch (error) {
    failed++
    console.log(`  \x1b[31m✗\x1b[0m ${label}\n      ${error.message}`)
  }
}

async function testAsync(label, fn) {
  try {
    await fn()
    passed++
    console.log(`  \x1b[32m✓\x1b[0m ${label}`)
  } catch (error) {
    failed++
    console.log(`  \x1b[31m✗\x1b[0m ${label}\n      ${error.message}`)
  }
}

/** Minimal stand-in for the Cordis context the Harness passes to apply(). */
function makeStubContext() {
  const tools = new Map()
  return {
    tools: {
      register(definition) {
        tools.set(definition.name, definition)
        return () => tools.delete(definition.name)
      },
    },
    logger: { info() {} },
    _tools: tools,
  }
}

/** The subset of ToolRegistry.register()'s validation we can check offline. */
function assertValidToolDefinition(tool) {
  assert.equal(typeof tool.name, 'string', 'name must be a string')
  assert.ok(tool.description?.length > 20, `${tool.name}: description too thin for a model to act on`)
  assert.equal(tool.parameters?.type, 'object', `${tool.name}: parameters must be an object schema`)
  assert.ok(tool.output && typeof tool.output === 'object', `${tool.name}: must declare output`)
  assert.ok(tool.output.schema, `${tool.name}: output.schema required`)
  assert.equal(typeof tool.output.render, 'function', `${tool.name}: output.render must be a function`)
  assert.equal(typeof tool.execute, 'function', `${tool.name}: execute must be a function`)

  // Every required key must exist in properties, or the registry rejects it.
  for (const key of tool.parameters.required ?? []) {
    assert.ok(tool.parameters.properties?.[key], `${tool.name}: required "${key}" missing from properties`)
  }
  walkSchema(tool.output.schema, `${tool.name}.output.schema`)
}

/** Reject schema constructs outside the subset DSH supports. */
function walkSchema(node, path) {
  const ALLOWED = new Set(['type', 'oneOf', 'properties', 'required', 'additionalProperties',
    'items', 'enum', 'const', 'description', 'title', 'default', 'examples'])
  assert.ok(node && typeof node === 'object', `${path}: not a schema object`)
  for (const key of Object.keys(node)) {
    assert.ok(ALLOWED.has(key), `${path}: unsupported schema keyword "${key}"`)
  }
  for (const [key, child] of Object.entries(node.properties ?? {})) {
    walkSchema(child, `${path}.properties.${key}`)
  }
  if (node.items) walkSchema(node.items, `${path}.items`)
  for (const required of node.required ?? []) {
    assert.ok(node.properties?.[required], `${path}: required "${required}" not in properties`)
  }
}

// ---------------------------------------------------------------------------

const workdir = mkdtempSync(join(tmpdir(), 'brain-test-'))
const storePath = join(workdir, 'brain.jsonl')

console.log('\n\x1b[1mplugin contract\x1b[0m')

const ctx = makeStubContext()
apply(ctx, { path: storePath })

test('exports the name and inject the loader reads', () => {
  assert.equal(name, 'second-brain')
  assert.deepEqual(inject, ['tools'])
})

test('registers exactly the four brain tools', () => {
  assert.deepEqual(
    [...ctx._tools.keys()].sort(),
    ['brain_forget', 'brain_recent', 'brain_save', 'brain_search'],
  )
})

test('every definition satisfies the registry contract', () => {
  for (const tool of ctx._tools.values()) assertValidToolDefinition(tool)
})

test('read-only tools declare themselves concurrency-safe', () => {
  assert.equal(ctx._tools.get('brain_search').isConcurrencySafe(), true)
  assert.equal(ctx._tools.get('brain_recent').isConcurrencySafe(), true)
  // Mutating tools must NOT opt in.
  assert.equal(ctx._tools.get('brain_save').isConcurrencySafe, undefined)
})

console.log('\n\x1b[1mtool execution\x1b[0m')

const call = (toolName, args) => ctx._tools.get(toolName).execute(args, { signal: new AbortController().signal })
const render = (toolName, args, value) => ctx._tools.get(toolName).output.render(args, value)

await testAsync('brain_save stores a note and returns the canonical value', async () => {
  const value = await call('brain_save', {
    text: 'Deploys to staging run through scripts/deploy.sh, never the CI button.',
    tags: ['Deploy', 'deploy', 'Staging'],
  })
  assert.equal(value.totalNotes, 1)
  assert.match(value.saved.id, /^[0-9a-f]{8}$/)
  // Tags are normalised and de-duplicated.
  assert.deepEqual(value.saved.tags, ['deploy', 'staging'])
  assert.ok(existsSync(storePath), 'the JSONL file should exist on disk')
})

await testAsync('brain_save rejects empty text', async () => {
  await assert.rejects(() => call('brain_save', { text: '   ' }), /non-empty/)
})

await testAsync('brain_save rejects an oversized note', async () => {
  const ctxSmall = makeStubContext()
  apply(ctxSmall, { path: join(workdir, 'small.jsonl'), maxNoteLength: 20 })
  await assert.rejects(
    () => ctxSmall._tools.get('brain_save').execute({ text: 'x'.repeat(50) }, {}),
    /limit is 20/,
  )
})

await testAsync('brain_search finds a note and explains why it matched', async () => {
  await call('brain_save', { text: 'Postgres migrations live in db/migrations and run on boot.', tags: ['postgres'] })
  const value = await call('brain_search', { query: 'postgres migrations' })

  assert.equal(value.total, 1)
  assert.ok(value.matches[0].score > 0)
  assert.ok(value.matches[0].matchedTerms.includes('postgres'))

  const text = render('brain_search', { query: 'postgres migrations' }, value)[0].text
  assert.match(text, /score/)
})

await testAsync('brain_search misses cleanly and says so', async () => {
  const value = await call('brain_search', { query: 'kubernetes ingress' })
  assert.equal(value.total, 0)
  const text = render('brain_search', { query: 'kubernetes ingress' }, value)[0].text
  assert.match(text, /No notes match/)
})

await testAsync('brain_search filters by tag', async () => {
  const value = await call('brain_search', { query: 'deploy', tag: 'staging' })
  assert.equal(value.total, 1)
  const none = await call('brain_search', { query: 'deploy', tag: 'nonexistent' })
  assert.equal(none.total, 0)
})

await testAsync('brain_recent returns newest first with tag counts', async () => {
  const value = await call('brain_recent', { limit: 5 })
  assert.equal(value.totalNotes, 2)
  assert.equal(value.notes[0].text.startsWith('Postgres'), true)
  assert.ok(value.tags.some((t) => t.tag === 'deploy'))
})

await testAsync('brain_forget deletes by id, and a miss is not an error', async () => {
  const { notes } = await call('brain_recent', {})
  const target = notes[0].id

  const hit = await call('brain_forget', { id: target })
  assert.equal(hit.removed, true)
  assert.equal(hit.remaining, 1)

  const miss = await call('brain_forget', { id: 'deadbeef' })
  assert.equal(miss.removed, false)
  assert.match(render('brain_forget', {}, miss)[0].text, /Nothing was deleted/)
})

console.log('\n\x1b[1mpersistence\x1b[0m')

await testAsync('notes survive a reload, which is the whole point', async () => {
  const reloaded = new BrainStore(storePath).load()
  assert.equal(reloaded.notes.size, 1, 'the deleted note must stay deleted after reload')
  assert.match([...reloaded.notes.values()][0].text, /Deploys to staging/)
})

test('a corrupt line is skipped rather than killing the store', () => {
  const path = join(workdir, 'corrupt.jsonl')
  const store = new BrainStore(path)
  store.save({ text: 'good note one' })
  store.save({ text: 'good note two' })
  // Simulate a torn write.
  appendFileSync(path, '{"id":"broken","text":\n', 'utf8')
  assert.equal(new BrainStore(path).load().notes.size, 2)
})

test('compaction drops tombstones but keeps live notes', () => {
  const path = join(workdir, 'compact.jsonl')
  const store = new BrainStore(path)
  const a = store.save({ text: 'keep me' })
  const b = store.save({ text: 'remove me' })
  store.forget(b.id)

  const linesBefore = readFileSync(path, 'utf8').trim().split('\n').length
  assert.equal(linesBefore, 3, 'two notes plus one tombstone')

  assert.equal(store.compact(), 1)
  const linesAfter = readFileSync(path, 'utf8').trim().split('\n').length
  assert.equal(linesAfter, 1)
  assert.equal(new BrainStore(path).load().notes.get(a.id).text, 'keep me')
})

rmSync(workdir, { recursive: true, force: true })

console.log(`\n${failed === 0 ? '\x1b[32m' : '\x1b[31m'}${passed} passed, ${failed} failed\x1b[0m\n`)
process.exit(failed === 0 ? 0 : 1)
