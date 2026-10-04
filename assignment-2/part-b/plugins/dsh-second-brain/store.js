// Storage layer for the second brain.
//
// Deliberately boring: an append-only JSONL file and an in-memory index. No
// database, no embeddings, no dependencies. The plugin has to survive process
// restarts and concurrent sessions in the same profile, and a line-per-note
// file does that with a truncated final line as the worst failure case.
//
// Kept in its own module so it can be unit-tested without a running Harness.

import { mkdirSync, appendFileSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'
import { randomUUID } from 'node:crypto'

/** Words too common to be worth matching on. */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'to', 'of', 'in', 'on', 'at', 'for', 'with', 'by', 'from', 'as', 'it', 'its',
  'this', 'that', 'these', 'those', 'i', 'we', 'you', 'they', 'he', 'she',
  'do', 'does', 'did', 'have', 'has', 'had', 'will', 'would', 'can', 'could',
  'my', 'our', 'your', 'their', 'me', 'us', 'them', 'so', 'if', 'then', 'than',
])

/** Split text into lowercase content terms. */
export function tokenize(text) {
  return String(text ?? '')
    .toLowerCase()
    .split(/[^a-z0-9_+#.-]+/)
    .filter((term) => term.length > 1 && !STOPWORDS.has(term))
}

export class BrainStore {
  /**
   * @param {string} path - absolute path to the JSONL file backing the store.
   */
  constructor(path) {
    this.path = path
    /** @type {Map<string, object>} id -> note */
    this.notes = new Map()
    this.loaded = false
  }

  /**
   * Read the file into memory. Tolerant by design: a corrupt or truncated line
   * is skipped rather than throwing, because losing one note is much better
   * than a plugin that refuses to load.
   */
  load() {
    if (this.loaded) return this
    this.notes.clear()

    if (existsSync(this.path)) {
      const raw = readFileSync(this.path, 'utf8')
      for (const line of raw.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed) continue
        try {
          const record = JSON.parse(trimmed)
          if (record && typeof record.id === 'string') {
            // A tombstone removes an earlier note; later lines win, which is
            // what makes an append-only file support deletion.
            if (record.deleted) this.notes.delete(record.id)
            else this.notes.set(record.id, record)
          }
        } catch {
          // Skip unparseable line.
        }
      }
    }

    this.loaded = true
    return this
  }

  #append(record) {
    mkdirSync(dirname(this.path), { recursive: true })
    appendFileSync(this.path, JSON.stringify(record) + '\n', 'utf8')
  }

  /**
   * Save a note.
   * @returns the stored record.
   */
  save({ text, tags = [], source = null }) {
    this.load()
    const note = {
      id: randomUUID().slice(0, 8),
      text: String(text).trim(),
      tags: [...new Set(tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean))],
      source: source ? String(source) : null,
      savedAt: new Date().toISOString(),
    }
    this.notes.set(note.id, note)
    this.#append(note)
    return note
  }

  /**
   * Keyword search over note text and tags.
   *
   * Scoring is transparent on purpose — a model reading the result can tell why
   * something matched, which matters more here than ranking sophistication:
   *   +3  per query term found in a tag
   *   +1  per query term occurrence in the text (capped per term)
   *   +2  whole-phrase match
   */
  search({ query, limit = 5, tag = null }) {
    this.load()
    const terms = tokenize(query)
    const phrase = String(query ?? '').trim().toLowerCase()
    const results = []

    for (const note of this.notes.values()) {
      if (tag && !note.tags.includes(String(tag).toLowerCase())) continue

      const haystack = note.text.toLowerCase()
      let score = 0
      const matched = []

      for (const term of terms) {
        if (note.tags.some((t) => t.includes(term))) {
          score += 3
          matched.push(term)
          continue
        }
        const occurrences = haystack.split(term).length - 1
        if (occurrences > 0) {
          score += Math.min(occurrences, 3)
          matched.push(term)
        }
      }

      if (phrase.length > 2 && haystack.includes(phrase)) score += 2
      // A tag filter alone is a valid query: "everything tagged deploy".
      if (score > 0 || (tag && terms.length === 0)) {
        results.push({ note, score, matched: [...new Set(matched)] })
      }
    }

    results.sort((a, b) =>
      b.score - a.score || b.note.savedAt.localeCompare(a.note.savedAt))

    return {
      total: results.length,
      matches: results.slice(0, limit).map(({ note, score, matched }) => ({
        id: note.id,
        text: note.text,
        tags: note.tags,
        savedAt: note.savedAt,
        source: note.source,
        score,
        matchedTerms: matched,
      })),
    }
  }

  /** Most recently saved notes first. */
  recent({ limit = 10, tag = null } = {}) {
    this.load()
    let notes = [...this.notes.values()]
    if (tag) {
      const wanted = String(tag).toLowerCase()
      notes = notes.filter((n) => n.tags.includes(wanted))
    }
    notes.sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    return notes.slice(0, limit).map((n) => ({
      id: n.id, text: n.text, tags: n.tags, savedAt: n.savedAt, source: n.source,
    }))
  }

  /** Delete by id, via a tombstone line. */
  forget(id) {
    this.load()
    if (!this.notes.has(id)) return false
    this.notes.delete(id)
    this.#append({ id, deleted: true, deletedAt: new Date().toISOString() })
    return true
  }

  /** Every tag in use, with counts, most used first. */
  tags() {
    this.load()
    const counts = new Map()
    for (const note of this.notes.values()) {
      for (const tag of note.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
  }

  /**
   * Rewrite the file with only live notes, dropping tombstones and superseded
   * lines. Append-only files grow; this is the garbage collector.
   */
  compact() {
    this.load()
    mkdirSync(dirname(this.path), { recursive: true })
    const lines = [...this.notes.values()]
      .sort((a, b) => a.savedAt.localeCompare(b.savedAt))
      .map((note) => JSON.stringify(note))
    writeFileSync(this.path, lines.length ? lines.join('\n') + '\n' : '', 'utf8')
    return this.notes.size
  }
}
