import { Logger } from '@n8n/backend-common';
import { CredentialsFinderService } from '@n8n/backend-services';
import type { User } from '@n8n/db';
import { CredentialsService } from '../../../../../credentials/credentials.service';
export declare class TeamsCredentialNotesService {
    private readonly credentialsFinderService;
    private readonly credentialsService;
    private readonly logger;
    constructor(credentialsFinderService: CredentialsFinderService, credentialsService: CredentialsService, logger: Logger);
    write(user: User, credentialId: string, notes: Record<string, string>): Promise<void>;
}
