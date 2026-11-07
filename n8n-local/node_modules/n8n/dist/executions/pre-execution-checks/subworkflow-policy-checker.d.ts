import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import { type INode, type IWorkflowBase } from 'n8n-workflow';
import { AccessService } from '../../services/access.service';
import { OwnershipService } from '../../services/ownership.service';
import { UrlService } from '@n8n/backend-services';
type WorkflowWithCallerPolicy = Pick<IWorkflowBase, 'id' | 'settings'>;
export declare class SubworkflowPolicyChecker {
    private readonly logger;
    private readonly ownershipService;
    private readonly globalConfig;
    private readonly accessService;
    private readonly urlService;
    constructor(logger: Logger, ownershipService: OwnershipService, globalConfig: GlobalConfig, accessService: AccessService, urlService: UrlService);
    check(subworkflow: WorkflowWithCallerPolicy, parentWorkflowId: string, node?: INode, userId?: string): Promise<void>;
    checkForProject(subworkflow: WorkflowWithCallerPolicy, parentProjectId: string, userId?: string): Promise<void>;
    private errorDetails;
    private findPolicy;
    private findProjects;
    private isListed;
    private readonly denialReasons;
    private logDenial;
}
export {};
