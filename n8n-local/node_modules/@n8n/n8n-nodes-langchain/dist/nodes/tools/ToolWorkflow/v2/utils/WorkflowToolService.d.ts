import { DynamicStructuredTool, DynamicTool } from '@langchain/core/tools';
import type { IExecuteFunctions, ISupplyDataFunctions } from 'n8n-workflow';
export declare class WorkflowToolService {
    private baseContext;
    private useSchema;
    private subWorkflowId;
    private subExecutionId;
    private returnAllItems;
    constructor(baseContext: ISupplyDataFunctions | IExecuteFunctions, options?: {
        returnAllItems: boolean;
    });
    createTool({ ctx, name, description, itemIndex, manualLogging, }: {
        ctx: ISupplyDataFunctions | IExecuteFunctions;
        name: string;
        description: string;
        itemIndex: number;
        manualLogging?: boolean;
    }): Promise<DynamicTool | DynamicStructuredTool>;
    private handleToolResponse;
    private executeSubWorkflow;
    private runFunction;
    private getSubWorkflowInfo;
    private prepareRawData;
    private prepareWorkflowItems;
    private createStructuredTool;
}
