import { type IExecuteFunctions, type INodeExecutionData, type WorkflowExecuteMode } from 'n8n-workflow';
/**
 * JS Code execution sandbox that executes the JS code using task runner.
 */
export declare class JsTaskRunnerSandbox {
    private readonly workflowMode;
    private readonly executeFunctions;
    private readonly chunkSize;
    private readonly additionalProperties;
    constructor(workflowMode: WorkflowExecuteMode, executeFunctions: Pick<IExecuteFunctions, 'startJob' | 'continueOnFail' | 'helpers'>, chunkSize?: number, additionalProperties?: Record<string, unknown>);
    runCodeAllItems(code: string): Promise<INodeExecutionData[]>;
    runCodeForTool(code: string): Promise<unknown>;
    runCodeForEachItem(code: string, numInputItems: number): Promise<INodeExecutionData[]>;
    runCode<T = unknown>(code: string): Promise<T>;
    /** Chunks the input items into chunks of 1000 items each */
    private chunkInputItems;
}
//# sourceMappingURL=JsTaskRunnerSandbox.d.ts.map