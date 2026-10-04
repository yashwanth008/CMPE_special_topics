// Host half of @local/dsh-brain-dock.
//
// This plugin is Client-only: all of its behaviour lives in client.js, which
// runs in the browser. The Loader still mounts a Host entry for the package,
// so it exports an apply() that does nothing.
//
// It must stay a no-op: a Host plugin exports EITHER a default service class
// OR named `apply`/`inject`/`Config`, never a mix, and adding Host behaviour
// here would change how the bundle has to be installed.

export const name = 'brain-dock'

export function apply() {
  // Intentionally empty — see client.js.
}
