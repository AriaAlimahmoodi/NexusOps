import type { Tool } from '@langchain/core/tools';
import type { ExecutionContext, ExecutionStrategy } from './ExecutionStrategy';
export declare class DirectExecutionStrategy implements ExecutionStrategy {
    executeTool(tool: Tool, args: Record<string, unknown>, _context: ExecutionContext): Promise<unknown>;
}
