import { GetQuickConnectApiKeyDto } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import { QuickConnectService } from './quick-connect.service';
export declare class QuickConnectController {
    private readonly quickConnectService;
    constructor(quickConnectService: QuickConnectService);
    getCredentialData(req: AuthenticatedRequest, _res: unknown, body: GetQuickConnectApiKeyDto): Promise<{
        apiKey: string;
    }>;
}
