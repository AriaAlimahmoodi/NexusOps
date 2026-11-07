import { GlobalConfig } from '@n8n/config';
import type { User } from '@n8n/db';
import type { IWorkflowSettings } from 'n8n-workflow';
import { WorkflowFinderService } from './workflow-finder.service';
import { WorkflowPublishedDataService } from '@n8n/backend-services';
import { SubworkflowPolicyChecker } from '../executions/pre-execution-checks/subworkflow-policy-checker';
import { NodeTypes } from '../node-types';
export type ErrorWorkflowProblem = {
    reason: 'not-found';
} | {
    reason: 'not-published';
    name: string;
} | {
    reason: 'no-error-trigger';
    name: string;
    errorTriggerType: string;
} | {
    reason: 'caller-policy';
    name: string;
};
export declare function isExpressionErrorWorkflowId(errorWorkflow: IWorkflowSettings['errorWorkflow']): boolean;
export declare function staticErrorWorkflowId(errorWorkflow: IWorkflowSettings['errorWorkflow']): string | undefined;
export declare class ErrorWorkflowValidationService {
    private readonly globalConfig;
    private readonly nodeTypes;
    private readonly workflowFinderService;
    private readonly workflowPublishedDataService;
    private readonly subworkflowPolicyChecker;
    constructor(globalConfig: GlobalConfig, nodeTypes: NodeTypes, workflowFinderService: WorkflowFinderService, workflowPublishedDataService: WorkflowPublishedDataService, subworkflowPolicyChecker: SubworkflowPolicyChecker);
    findProblem({ errorWorkflowId, parentWorkflowId, user, }: {
        errorWorkflowId: string;
        parentWorkflowId: string;
        user: User;
    }): Promise<ErrorWorkflowProblem | undefined>;
}
