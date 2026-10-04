// Offline verification for @local/dsh-brain-dock.
//
// The dock is browser code, so this script supplies the two things the page
// would: a `window.__ModuleLoader__` that captures the registered factory, and
// a `require` that returns a minimal React stand-in. It then drives the
// component's behaviour directly — typing, capturing, recalling — and asserts
// on what reaches `inputActions`.
//
//   node tests/test-brain-dock.mjs
//
// What this proves: the registration shape is right, the slot options are
// right, and the instructions the dock writes into the composer are the ones
// that will actually route to the brain_* tools. What it cannot prove: how it
// looks. That needs the running Web UI.

import assert from 'node:assert/strict'

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

// --------------------------------------------------------------- React stub
//
// Enough React to render function components synchronously and keep hook state
// between renders. Hooks are stored per component instance in call order,
// which is exactly the rule real React enforces.

function createReactStub() {
  let hooks = []
  let cursor = 0
  let rerender = () => {}

  const React = {
    createElement: (type, props, ...children) => ({
      type,
      props: { ...(props ?? {}), children: children.flat().filter(Boolean) },
    }),
    useState(initial) {
      const slot = cursor++
      if (!(slot in hooks)) hooks[slot] = typeof initial === 'function' ? initial() : initial
      const set = (next) => {
        hooks[slot] = typeof next === 'function' ? next(hooks[slot]) : next
        rerender()
      }
      return [hooks[slot], set]
    },
    // Dependency memoisation is irrelevant to these assertions; always return
    // the current closure so state reads are never stale.
    useCallback: (fn) => fn,
    useRef(initial) {
      const slot = cursor++
      if (!(slot in hooks)) hooks[slot] = { current: initial }
      return hooks[slot]
    },
  }

  return {
    React,
    /** Render a component and return { tree, setRerender } with fresh hooks. */
    mount(Component, props) {
      hooks = []
      let tree
      rerender = () => { cursor = 0; tree = Component(props) }
      rerender()
      return {
        get tree() { return tree },
        rerender: () => rerender(),
      }
    },
  }
}

/** Depth-first search of a stub element tree. */
function find(node, predicate) {
  if (!node || typeof node !== 'object') return null
  if (predicate(node)) return node
  for (const child of node.props?.children ?? []) {
    const hit = find(child, predicate)
    if (hit) return hit
  }
  return null
}

const byType = (type) => (node) => node.type === type
const buttonLabelled = (label) => (node) =>
  node.type === 'button' && node.props.children.includes(label)

// ------------------------------------------------------------------ harness

const { React, mount } = createReactStub()

globalThis.window = {
  __ModuleLoader__: {
    load(registration) { globalThis.__registered = registration },
  },
}
globalThis.setTimeout = globalThis.setTimeout ?? (() => 0)

await import('../plugins/dsh-brain-dock/client.js')
const registration = globalThis.__registered

console.log('\n\x1b[1mmodule registration\x1b[0m')

test('registers under an id equal to the package name', () => {
  assert.equal(registration.id, '@local/dsh-brain-dock')
  assert.equal(typeof registration.factory, 'function')
})

const plugin = registration.factory((name) => {
  if (name === 'react') return React
  throw new Error(`unexpected require(${name})`)
})

test('the factory returns a plugin injecting slots', () => {
  assert.deepEqual(plugin.inject, ['slots'])
  assert.equal(typeof plugin.apply, 'function')
})

console.log('\n\x1b[1mslot registration\x1b[0m')

let registeredOptions = null
let RegisteredComponent = null
let disposed = false

const slotCtx = {
  effect(fn) { this._dispose = fn() },
  slots: {
    inject(slotName, register) {
      assert.equal(slotName, 'conversation.composer.dock')
      return register()
    },
    register(options, Component) {
      registeredOptions = options
      RegisteredComponent = Component
      return () => { disposed = true }
    },
  },
}

plugin.apply(slotCtx)

test('registers into the composer dock with its own id', () => {
  assert.equal(registeredOptions.name, 'conversation.composer.dock')
  assert.equal(registeredOptions.id, 'brain-dock')
  // A fresh id is additive; reusing a shipped id would REPLACE that entry.
  assert.notEqual(registeredOptions.id, 'stats')
  assert.equal(typeof RegisteredComponent, 'function')
})

test('orders itself after the shipped stats pills', () => {
  assert.ok(registeredOptions.order > 0, 'stats registers at order 0')
})

test('registration is owned by an effect, so unload removes the dock', () => {
  assert.equal(typeof slotCtx._dispose, 'function')
  slotCtx._dispose()
  assert.equal(disposed, true)
})

console.log('\n\x1b[1mcapture behaviour\x1b[0m')

/** Mount the dock with a recording inputActions double. */
function mountDock() {
  const sent = []
  const inputActions = {
    setDraft: (text) => sent.push({ kind: 'draft', text }),
    submit: () => sent.push({ kind: 'submit' }),
  }
  const view = mount(RegisteredComponent, { inputActions, sessionId: 'session-1' })
  const type = (text) => {
    find(view.tree, byType('input')).props.onChange({ target: { value: text } })
  }
  const click = (label) => {
    find(view.tree, buttonLabelled(label)).props.onClick()
  }
  return { view, sent, type, click }
}

test('renders an input and both actions', () => {
  const { view } = mountDock()
  assert.ok(find(view.tree, byType('input')), 'no input rendered')
  assert.ok(find(view.tree, buttonLabelled('save')), 'no save button')
  assert.ok(find(view.tree, buttonLabelled('recall')), 'no recall button')
})

test('save writes a brain_save instruction and submits it', () => {
  const { sent, type, click } = mountDock()
  type('staging deploys go through scripts/deploy.sh')
  click('save')

  assert.equal(sent.length, 2)
  assert.equal(sent[0].kind, 'draft')
  assert.match(sent[0].text, /brain_save/)
  assert.match(sent[0].text, /staging deploys go through scripts\/deploy\.sh/)
  assert.equal(sent[1].kind, 'submit')
})

test('#hashtags become tags and leave the note body', () => {
  const { sent, type, click } = mountDock()
  type('rotate the API key quarterly #security #ops')
  click('save')

  const draft = sent[0].text
  assert.match(draft, /Tag it: security, ops\./)
  assert.match(draft, /Note: rotate the API key quarterly/)
  assert.ok(!/#security/.test(draft.split('Note:')[1]), 'hashtags should be stripped from the body')
})

test('the input clears after a successful capture', () => {
  const { view, type, click } = mountDock()
  type('something worth keeping')
  click('save')
  assert.equal(find(view.tree, byType('input')).props.value, '')
})

test('an empty capture sends nothing and warns instead', () => {
  const { view, sent, type, click } = mountDock()
  type('   ')
  click('save')
  assert.equal(sent.length, 0, 'nothing should reach the composer')
  assert.ok(find(view.tree, (n) => n.props?.role === 'status'), 'no feedback shown')
})

console.log('\n\x1b[1mrecall behaviour\x1b[0m')

test('recall with text searches the brain', () => {
  const { sent, type, click } = mountDock()
  type('postgres migrations')
  click('recall')
  assert.match(sent[0].text, /brain_search/)
  assert.match(sent[0].text, /postgres migrations/)
})

test('recall with an empty box lists recent notes', () => {
  const { sent, click } = mountDock()
  click('recall')
  assert.match(sent[0].text, /brain_recent/)
})

test('enter captures, cmd+enter recalls', () => {
  const { view, sent, type } = mountDock()
  const press = (init) => find(view.tree, byType('input')).props.onKeyDown({
    key: 'Enter', preventDefault() {}, shiftKey: false, metaKey: false, ctrlKey: false, ...init,
  })

  type('note one')
  press({})
  assert.match(sent[0].text, /brain_save/)

  type('note two')
  press({ metaKey: true })
  assert.match(sent[2].text, /brain_search/)
})

test('shift+enter is left alone for newlines', () => {
  const { view, sent, type } = mountDock()
  type('multi line')
  find(view.tree, byType('input')).props.onKeyDown({
    key: 'Enter', shiftKey: true, preventDefault() { throw new Error('should not preventDefault') },
  })
  assert.equal(sent.length, 0)
})

console.log('\n\x1b[1mdefensive behaviour\x1b[0m')

test('a host without inputActions degrades instead of crashing', () => {
  const view = mount(RegisteredComponent, { sessionId: 's' })
  find(view.tree, buttonLabelled('save')).props.onClick()   // must not throw
  find(view.tree, byType('input')).props.onChange({ target: { value: 'x' } })
  find(view.tree, buttonLabelled('save')).props.onClick()
  assert.ok(find(view.tree, (n) => n.props?.role === 'status'), 'should surface a warning')
})

console.log(`\n${failed === 0 ? '\x1b[32m' : '\x1b[31m'}${passed} passed, ${failed} failed\x1b[0m\n`)
process.exit(failed === 0 ? 0 : 1)
