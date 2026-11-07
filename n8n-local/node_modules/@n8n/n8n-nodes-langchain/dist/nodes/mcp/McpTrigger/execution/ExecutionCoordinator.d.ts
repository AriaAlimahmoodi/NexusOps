import type { Tool } from '@langchain/core/tools';
import type { ExecutionContext, ExecutionStrategy } from './ExecutionStrategy';
export declare class ExecutionCoordinator {
    private strategy;
    constructor(strategy?: ExecutionStrategy);
    executeTool(tool: Tool, args: Record<string, unknown>, context: ExecutionContext): Promise<unknown>;
    setStrategy(strategy: ExecutionStrategy): void;
    getStrategy(): ExecutionStrategy;
    isQueueMode(): boolean;
}
