import { type DataTableInfo } from '../../utils/data-table-helpers';
export interface ResponderPromptOptions {
    enableIntrospection?: boolean;
}
export declare function buildRecursionErrorWithWorkflowGuidance(nodeCount: number): string[];
export declare function buildRecursionErrorNoWorkflowGuidance(): string[];
export declare function buildGeneralErrorGuidance(): string;
export declare function buildDataTableCreationGuidance(dataTables: DataTableInfo[]): string;
export declare function buildResponderPrompt(options?: ResponderPromptOptions): string;
