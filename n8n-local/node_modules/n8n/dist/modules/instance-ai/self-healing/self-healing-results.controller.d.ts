import { AuthenticatedRequest } from '@n8n/db';
import { SelfHealingResultService } from './self-healing-result.service';
type ResultRequest = AuthenticatedRequest<{
    projectId: string;
    workflowId: string;
    resultId: string;
}>;
export declare class SelfHealingResultsController {
    private readonly results;
    constructor(results: SelfHealingResultService);
    getDetail(req: ResultRequest): Promise<import("@n8n/api-types").SelfHealingResultDetail>;
    approveAndPublish(req: ResultRequest): Promise<import("@n8n/api-types").SelfHealingResultActionResponse>;
    apply(req: ResultRequest): Promise<import("@n8n/api-types").SelfHealingResultActionResponse>;
    dismiss(req: ResultRequest): Promise<import("@n8n/api-types").SelfHealingResultDetail>;
}
export {};
