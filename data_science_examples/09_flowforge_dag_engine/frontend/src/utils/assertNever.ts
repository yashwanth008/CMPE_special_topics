/**
 * Exhaustive Compile-Time Check Utility (Matt Pocock Design Pattern)
 * Ensures all branches of a Discriminated Union are handled.
 * If a new variant is added to the union, TypeScript throws a compile-time type error here.
 */
export function assertNever(value: never, customMessage?: string): never {
  throw new Error(
    customMessage || `Unhandled discriminated union member: ${JSON.stringify(value)}`
  );
}
