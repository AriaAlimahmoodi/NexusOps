import { LicenseState } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import type { User } from '@n8n/db';
import { CredentialsService } from '../credentials/credentials.service';
import { AiService } from '../services/ai.service';
import { UserService } from '../services/user.service';
export declare class FreeAiCreditsService {
    private readonly licenseState;
    private readonly globalConfig;
    private readonly aiService;
    private readonly credentialsService;
    private readonly userService;
    constructor(licenseState: LicenseState, globalConfig: GlobalConfig, aiService: AiService, credentialsService: CredentialsService, userService: UserService);
    isEligible(user: User): boolean;
    claim(user: User, projectId?: string): Promise<{
        id: string;
        generateId(): void;
        createdAt: Date;
        updatedAt: Date;
        setUpdateDate(): void;
        name: string;
        description: string | null;
        data: string;
        type: string;
        isManaged: boolean;
        isGlobal: boolean;
        isResolvable: boolean;
        resolvableAllowFallback: boolean;
        resolverId: string | null;
        usageScope: import("@n8n/db").CredentialUsageScope;
        pendingAuthorizationExpiresAt: Date | null;
        scopes: import("@n8n/permissions").Scope[];
    }>;
}
