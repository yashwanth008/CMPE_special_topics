// Browser artifact for @local/dsh-brain-dock.
//
// WHAT THIS IS
// A Client plugin: a lazy module factory registered with the browser module
// loader under an id equal to the package name. The Harness Web UI loads it,
// calls `factory(require)`, and applies the returned plugin object — the same
// `inject` / `apply(ctx)` shape as a Host plugin, but running in the page.
//
// WHERE IT APPEARS
// It registers into `conversation.composer.dock`, a LIST slot that already
// allocates space below the composer card (the shipped token-stats pills live
// in the same slot). A list slot is additive, so a fresh `id` sits beside the
// shipped entries instead of replacing them.
//
// HOW IT TALKS TO THE SECOND BRAIN
// It does not call the Host directly. Crossing that boundary means declaring a
// Remote API, which needs decorators, codegen and a build step. Instead the
// dock does what a user does: it writes an instruction into the composer draft
// via `inputActions.setDraft()` and submits it. The agent then calls
// `brain_save` / `brain_search` itself. One-way, no new wire protocol, and
// every capture is visible in the transcript.
//
// React comes from the browser module table via `require('react')` — never a
// second copy, never a CDN script.

window.__ModuleLoader__.load({
  id: '@local/dsh-brain-dock',

  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useCallback, useRef } = React

    // Inherit the host theme rather than hard-coding colours, so the dock
    // follows light/dark automatically.
    const styles = {
      row: {
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 0', width: '100%', boxSizing: 'border-box',
      },
      badge: {
        fontSize: 11, opacity: 0.6, userSelect: 'none',
        whiteSpace: 'nowrap', letterSpacing: '0.02em',
      },
      input: {
        flex: 1, minWidth: 0,
        font: 'inherit', fontSize: 12,
        padding: '3px 8px',
        color: 'inherit', background: 'transparent',
        border: '1px solid currentColor', borderRadius: 6,
        opacity: 0.75, outline: 'none',
      },
      button: {
        font: 'inherit', fontSize: 11, padding: '3px 10px',
        color: 'inherit', background: 'transparent',
        border: '1px solid currentColor', borderRadius: 6,
        opacity: 0.7, cursor: 'pointer', whiteSpace: 'nowrap',
      },
      hint: { fontSize: 11, opacity: 0.55, paddingLeft: 2 },
    }

    /**
     * Build the instruction sent to the agent. Phrased as a direct request so
     * the model routes it to the brain_save tool rather than replying in prose.
     */
    function captureInstruction(text, tags) {
      const tagPart = tags.length ? ` Tag it: ${tags.join(', ')}.` : ''
      return `Save this to my second brain using the brain_save tool.${tagPart}\n\nNote: ${text}`
    }

    /** Pull #hashtags out of the typed text; the rest is the note body. */
    function splitTags(raw) {
      const tags = []
      const text = raw
        .replace(/#([\w-]+)/g, (_match, tag) => { tags.push(tag.toLowerCase()); return '' })
        .replace(/\s+/g, ' ')
        .trim()
      return { text, tags }
    }

    /**
     * @param {object} props - standard props the composer dock slot supplies.
     */
    function BrainDock(props) {
      const { inputActions, sessionId } = props
      const [value, setValue] = useState('')
      const [flash, setFlash] = useState(null)
      const flashTimer = useRef(null)

      const showFlash = useCallback((message) => {
        setFlash(message)
        if (flashTimer.current) clearTimeout(flashTimer.current)
        flashTimer.current = setTimeout(() => setFlash(null), 2600)
      }, [])

      const send = useCallback((draft) => {
        // Defensive: a slot's props are a contract, but a host version that
        // renders this dock without inputActions should degrade, not crash.
        if (!inputActions || typeof inputActions.setDraft !== 'function') {
          showFlash('composer unavailable')
          return false
        }
        inputActions.setDraft(draft)
        if (typeof inputActions.submit === 'function') inputActions.submit()
        return true
      }, [inputActions, showFlash])

      const capture = useCallback(() => {
        const { text, tags } = splitTags(value)
        if (!text) {
          showFlash('type something to remember')
          return
        }
        if (send(captureInstruction(text, tags))) {
          setValue('')
          showFlash(tags.length ? `captured · ${tags.join(' ')}` : 'captured')
        }
      }, [value, send, showFlash])

      const recall = useCallback(() => {
        const { text } = splitTags(value)
        const draft = text
          ? `Search my second brain with brain_search for: ${text}`
          : 'Show me what you remember — call brain_recent and summarise it.'
        if (send(draft)) {
          setValue('')
          showFlash(text ? 'searching' : 'recalling')
        }
      }, [value, send, showFlash])

      const onKeyDown = useCallback((event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault()
          // Cmd/Ctrl-Enter recalls instead of capturing.
          if (event.metaKey || event.ctrlKey) recall()
          else capture()
        }
      }, [capture, recall])

      return h('div', { style: styles.row, 'data-testid': 'brain-dock' },
        h('span', { style: styles.badge, title: sessionId ? `session ${sessionId}` : undefined }, '🧠 brain'),
        h('input', {
          style: styles.input,
          value,
          placeholder: 'remember this…  #tag   (enter to save, ⌘/ctrl+enter to recall)',
          'aria-label': 'Capture a note to the second brain',
          onChange: (event) => setValue(event.target.value),
          onKeyDown,
        }),
        h('button', { style: styles.button, onClick: capture, type: 'button' }, 'save'),
        h('button', { style: styles.button, onClick: recall, type: 'button' }, 'recall'),
        flash ? h('span', { style: styles.hint, role: 'status' }, flash) : null,
      )
    }

    return {
      inject: ['slots'],

      apply(ctx) {
        // `slots.inject` defers registration until the slot exists; the
        // returned disposer is owned by this plugin's fiber, so unloading the
        // plugin removes the dock. Nothing to clean up by hand.
        ctx.effect(() => ctx.slots.inject('conversation.composer.dock', () =>
          ctx.slots.register(
            {
              name: 'conversation.composer.dock',
              id: 'brain-dock',
              // The shipped stats pills register at order 0; sit below them.
              order: 20,
              label: 'Second brain',
            },
            BrainDock,
          ),
        ))
      },
    }
  },
})
