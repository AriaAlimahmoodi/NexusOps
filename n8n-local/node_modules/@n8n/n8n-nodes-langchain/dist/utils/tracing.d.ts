import type { BaseCallbackConfig } from '@langchain/core/callbacks/manager';
import type { IExecuteFunctions, ISupplyDataFunctions, Logger } from 'n8n-workflow';
interface TracingConfig {
    additionalMetadata?: Record<string, unknown>;
}
export type TracingMetadataEntry = {
    key: string;
    type?: 'stringValue' | 'numberValue' | 'booleanValue' | 'arrayValue' | 'objectValue';
    stringValue?: string;
    numberValue?: string;
    booleanValue?: string;
    arrayValue?: string;
    objectValue?: string;
};
export declare function buildTracingMetadata(entries: TracingMetadataEntry[] | undefined, logger?: Logger): Record<string, unknown>;
export declare function getTracingConfig(context: IExecuteFunctions | ISupplyDataFunctions, config?: TracingConfig): BaseCallbackConfig;
export {};
