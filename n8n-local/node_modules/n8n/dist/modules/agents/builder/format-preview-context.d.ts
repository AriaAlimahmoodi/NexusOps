import type { AgentExecutionThread } from '../entities/agent-execution-thread.entity';
import type { AgentExecution } from '../entities/agent-execution.entity';
export declare const PREVIEW_CONTEXT_OPEN_TAG = "<preview_session_context>";
export declare const PREVIEW_CONTEXT_CLOSE_TAG = "</preview_session_context>";
export declare function formatPreviewSessionContext(thread: AgentExecutionThread, executions: AgentExecution[], executionId?: string): string | null;
