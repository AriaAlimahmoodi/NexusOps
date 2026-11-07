import { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { QuickConnectConfig } from './quick-connect.config';
export declare class QuickConnectService {
    private readonly logger;
    private readonly quickConnectConfig;
    private readonly handlers;
    constructor(logger: Logger, quickConnectConfig: QuickConnectConfig);
    getCredentialData(quickConnectType: string, user: User): Promise<{
        apiKey: string;
    }>;
    registerHandlers(): Promise<void>;
}
