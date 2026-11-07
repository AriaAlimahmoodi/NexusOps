import type { IWorkflowExecuteAdditionalData } from 'n8n-workflow';
import { Workflow } from 'n8n-workflow';
export declare class TriggerCountService {
    count(workflow: Workflow, additionalData: IWorkflowExecuteAdditionalData): number;
}
