import { IWorkflowBase } from 'n8n-workflow';
import { ExecutionEntity } from './execution-entity';
import { ISimplifiedPinData } from './types-db';
export declare class ExecutionData {
    data: string;
    workflowData: Omit<IWorkflowBase, 'pinData'> & {
        pinData?: ISimplifiedPinData;
    };
    executionId: string;
    workflowVersionId: string | null;
    execution: ExecutionEntity;
}
