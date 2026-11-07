import type { Logger } from '@n8n/backend-common';
import type { BuilderTool, BuilderToolBase } from '../utils/stream-processor';
export declare const GET_EXECUTION_LOGS_TOOL: BuilderToolBase;
export declare function createGetExecutionLogsTool(logger?: Logger): BuilderTool;
