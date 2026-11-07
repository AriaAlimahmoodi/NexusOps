import { type IRun } from 'n8n-workflow';
import type { ActiveExecutions } from '../../../active-executions';
import type { McpService } from '../../../modules/mcp/mcp.service';
export declare const WORKFLOW_EXECUTION_TIMEOUT_MS: number;
export declare const WORKFLOW_EXECUTION_TIMEOUT_DEFAULT_SECONDS: number;
export declare const WORKFLOW_EXECUTION_TIMEOUT_MAX_SECONDS: number;
export declare const waitForExecutionResult: (executionId: string, activeExecutions: ActiveExecutions, mcpService: McpService, timeoutMs?: number) => Promise<IRun>;
