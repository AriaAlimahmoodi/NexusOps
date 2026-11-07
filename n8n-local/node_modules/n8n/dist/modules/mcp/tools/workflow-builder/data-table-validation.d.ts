import type { INode } from 'n8n-workflow';
import { type DataTableUserOperations } from '../../../../modules/data-table/data-table-proxy.service';
export interface DataTableValidationFailure {
    ok: false;
    error: string;
    opIndex?: number;
}
export interface DataTableValidationSuccess {
    ok: true;
}
export type DataTableValidationResult = DataTableValidationSuccess | DataTableValidationFailure;
export declare function validateDataTableReferencesForWorkflow(nodes: INode[], projectId: string, dataTableOps: DataTableUserOperations): Promise<DataTableValidationResult>;
export declare function validateDataTableReferencesForUpdate(nodesAfterApply: INode[], touchedNodes: Map<string, number>, projectId: string, dataTableOps: DataTableUserOperations): Promise<DataTableValidationResult>;
