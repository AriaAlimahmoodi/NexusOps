import type { User } from '@n8n/db';
import { CredentialsService } from '../../../credentials/credentials.service';
export declare class AgentCredentialLookupService {
    private readonly credentialsService;
    constructor(credentialsService: CredentialsService);
    decryptForUser(user: User, projectId: string, credentialId: string, expectedType: string): Promise<import("n8n-workflow").ICredentialDataDecryptedObject | null>;
    decryptForProject(projectId: string, credentialId: string, expectedType: string): Promise<import("n8n-workflow").ICredentialDataDecryptedObject | null>;
}
