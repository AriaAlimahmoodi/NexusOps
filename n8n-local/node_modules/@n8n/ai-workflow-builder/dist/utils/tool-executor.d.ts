import type { ToolExecutorOptions } from '../types/config';
import type { WorkflowState } from '../workflow-state';
export declare function executeToolsInParallel(options: ToolExecutorOptions): Promise<Partial<typeof WorkflowState.State>>;
