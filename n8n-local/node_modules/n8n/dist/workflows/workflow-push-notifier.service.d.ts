import type { PushMessage } from '@n8n/api-types';
import { Push } from '../push';
import { WorkflowSharingService } from '@n8n/backend-services';
export declare class WorkflowPushNotifier {
    private readonly push;
    private readonly workflowSharingService;
    constructor(push: Push, workflowSharingService: WorkflowSharingService);
    notify(workflowId: string, pushMsg: PushMessage): Promise<void>;
}
