import { EngineState, EngineEvent, RunId } from '../types/domain';
import { Result, Ok, Err } from '../utils/result';

export const VALID_TRANSITIONS: Record<EngineState, EngineState[]> = {
  idle: ['validating'],
  validating: ['compiling', 'failed'],
  compiling: ['running', 'failed'],
  running: ['paused', 'completed', 'failed'],
  paused: ['running', 'failed', 'idle'],
  completed: ['idle', 'validating'],
  failed: ['idle', 'validating'],
};

export interface MachineContext {
  state: EngineState;
  activeRunId: RunId | null;
  errorMessage: string | null;
}

export function transition(
  current: MachineContext,
  event: EngineEvent
): Result<MachineContext, string> {
  const currentState = current.state;

  switch (event.type) {
    case 'START_VALIDATION': {
      if (VALID_TRANSITIONS[currentState].includes('validating')) {
        return Ok({
          ...current,
          state: 'validating',
          errorMessage: null,
        });
      }
      return Err(`Cannot transition to validating from ${currentState}`);
    }

    case 'START_COMPILATION': {
      if (VALID_TRANSITIONS[currentState].includes('compiling')) {
        return Ok({
          ...current,
          state: 'compiling',
          errorMessage: null,
        });
      }
      return Err(`Cannot transition to compiling from ${currentState}`);
    }

    case 'COMPILATION_ERROR': {
      if (VALID_TRANSITIONS[currentState].includes('failed')) {
        return Ok({
          ...current,
          state: 'failed',
          errorMessage: event.error,
        });
      }
      return Err(`Cannot transition to failed from ${currentState}`);
    }

    case 'START_EXECUTION': {
      if (VALID_TRANSITIONS[currentState].includes('running')) {
        return Ok({
          ...current,
          state: 'running',
          errorMessage: null,
        });
      }
      return Err(`Cannot transition to running from ${currentState}`);
    }

    case 'PAUSE': {
      if (VALID_TRANSITIONS[currentState].includes('paused')) {
        return Ok({
          ...current,
          state: 'paused',
        });
      }
      return Err(`Cannot pause from ${currentState}`);
    }

    case 'RESUME': {
      if (VALID_TRANSITIONS[currentState].includes('running')) {
        return Ok({
          ...current,
          state: 'running',
        });
      }
      return Err(`Cannot resume from ${currentState}`);
    }

    case 'EXECUTION_SUCCESS': {
      if (VALID_TRANSITIONS[currentState].includes('completed')) {
        return Ok({
          ...current,
          state: 'completed',
          activeRunId: event.runId,
          errorMessage: null,
        });
      }
      return Err(`Cannot complete from ${currentState}`);
    }

    case 'EXECUTION_FAILURE': {
      if (VALID_TRANSITIONS[currentState].includes('failed')) {
        return Ok({
          ...current,
          state: 'failed',
          errorMessage: event.error,
        });
      }
      return Err(`Cannot fail from ${currentState}`);
    }

    case 'RESET': {
      return Ok({
        state: 'idle',
        activeRunId: null,
        errorMessage: null,
      });
    }

    default:
      return Err(`Unknown event type`);
  }
}
