import type { DynamicStructuredToolInput } from '@langchain/core/tools';
import { DynamicStructuredTool, DynamicTool } from '@langchain/core/tools';
import type { ISupplyDataFunctions } from 'n8n-workflow';
import { ZodObject } from 'zod';
import type { ZodObjectAny } from '../types/types';
export declare const prepareFallbackToolDescription: (toolDescription: string, schema: ZodObject<any>) => string;
export declare class N8nTool extends DynamicStructuredTool<ZodObjectAny> {
    private context;
    constructor(context: ISupplyDataFunctions, fields: DynamicStructuredToolInput<ZodObjectAny>);
    asDynamicTool(): DynamicTool;
}
