import { AuthenticatedRequest } from '@n8n/db';
import { Response } from 'express';
import { TestWebhooks } from '../webhooks/test-webhooks';
export declare class TestWebhooksController {
    private readonly testWebhooks;
    constructor(testWebhooks: TestWebhooks);
    cancel(_req: AuthenticatedRequest, _res: Response, workflowId: string): Promise<void>;
}
