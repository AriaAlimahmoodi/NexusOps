import type { IExecuteFunctions, ILoadOptionsFunctions, ISupplyDataFunctions } from 'n8n-workflow';
export declare function getUserScopedSlot(context: IExecuteFunctions | ISupplyDataFunctions | ILoadOptionsFunctions, prefix: string, itemIndex?: number): string;
export declare function ensureUserId(context: IExecuteFunctions | ISupplyDataFunctions | ILoadOptionsFunctions, itemIndex?: number): string;
