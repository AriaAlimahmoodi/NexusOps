import type { WorkflowJSON, OutputSchemaLookup, PinDataGenerationInstructions, DataTableColumnInfo } from '@n8n/workflow-sdk';
export { findOutputParserTargets, repairStructuredOutput } from '@n8n/workflow-sdk';
type PinData = Record<string, Array<Record<string, unknown>>>;
export interface GeneratePinDataOptions {
    workflow: WorkflowJSON;
    nodeNames: string[];
    instructions?: PinDataGenerationInstructions;
    outputSchemaLookup?: OutputSchemaLookup;
    dataTableColumns?: Record<string, DataTableColumnInfo[]>;
}
export declare function generatePinData(options: GeneratePinDataOptions): Promise<PinData>;
