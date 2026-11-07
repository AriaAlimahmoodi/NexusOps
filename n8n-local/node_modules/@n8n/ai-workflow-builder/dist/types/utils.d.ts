import type { WorkflowState } from '../workflow-state';
export type StateUpdater<TState = typeof WorkflowState.State> = Partial<TState> | ((state: TState) => Partial<TState>);
