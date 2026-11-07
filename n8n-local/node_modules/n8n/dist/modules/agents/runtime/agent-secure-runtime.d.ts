import type { ToolDescriptor } from '@n8n/agents';
import { Logger } from '@n8n/backend-common';
import type { ToolExecutor } from '../json-config/from-json-config';
export declare class AgentSecureRuntime {
    private readonly logger;
    constructor(logger: Logger);
    private pool;
    private poolInitPromise;
    private disposed;
    private libraryBundle;
    private getPool;
    private withIsolate;
    private getLibraryBundle;
    private compileTs;
    private loadToolInContext;
    private parseSandboxJson;
    private runInContext;
    describeToolSecurely(tsCode: string): Promise<ToolDescriptor>;
    executeToolInIsolate(toolCode: string, input: unknown, ctx: unknown): Promise<unknown>;
    private executeToMessageInIsolate;
    createToolExecutor(toolsByName: Record<string, string>): ToolExecutor;
    dispose(): void;
}
